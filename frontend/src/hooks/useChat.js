// Conversation history + context management + demo usage counter, all in one hook.
//
// Isolation rules:
//  * each conversation owns its own ordered `messages` array
//  * a request only ever sends messages from the conversation it was started in
//  * the reply is written back to that same conversation id, even if the user
//    switched chats while waiting
import { useCallback, useEffect, useRef, useState } from 'react';
import { load, save, uid } from '../lib/storage';
import { buildContext, sendChat } from '../lib/api';

export const PROMPT_LIMIT = 50;

const makeTitle = (text) => {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > 42 ? `${clean.slice(0, 42).trimEnd()}…` : clean || 'New chat';
};

export function useChat(username) {
  const convKey = `minigpt:conversations:${username}`;
  const usageKey = `minigpt:usage:${username}`;

  const [conversations, setConversations] = useState(() => load(convKey, []));
  const [activeId, setActiveId] = useState(null);
  const [used, setUsed] = useState(() => load(usageKey, { used: 0 }).used);
  const [pending, setPending] = useState(null); // { convId } while waiting for the backend
  const abortRef = useRef(null);
  const convRef = useRef(conversations);
  convRef.current = conversations;

  useEffect(() => save(convKey, conversations), [convKey, conversations]);
  useEffect(() => save(usageKey, { used }), [usageKey, used]);

  const remaining = Math.max(0, PROMPT_LIMIT - used);
  const active = conversations.find((c) => c.id === activeId) || null;

  const patchConversation = useCallback((id, fn) => {
    setConversations((list) => list.map((c) => (c.id === id ? fn(c) : c)));
  }, []);

  // Ask the backend for a reply to `history` and append it to conversation `convId`.
  const requestReply = useCallback(async (convId, history, temperature) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setPending({ convId });
    try {
      const data = await sendChat(buildContext(history), { temperature, signal: controller.signal });
      patchConversation(convId, (c) => ({
        ...c,
        updatedAt: Date.now(),
        messages: [
          ...c.messages,
          { id: uid(), role: 'assistant', content: data.reply, createdAt: Date.now(), contextMessages: data.context_messages },
        ],
      }));
      setUsed((u) => u + 1); // credit only for successful responses
      return true;
    } catch (err) {
      const stopped = err.name === 'AbortError';
      patchConversation(convId, (c) => ({
        ...c,
        messages: [
          ...c.messages,
          {
            id: uid(),
            role: 'assistant',
            error: true,
            content: stopped ? 'Generation stopped.' : err.message,
            createdAt: Date.now(),
          },
        ],
      }));
      return false;
    } finally {
      abortRef.current = null;
      setPending(null);
    }
  }, [patchConversation]);

  const send = useCallback(async (text) => {
    const prompt = text.trim();
    if (!prompt || pending || remaining <= 0) return false;

    const userMsg = { id: uid(), role: 'user', content: prompt, createdAt: Date.now() };
    let convId = activeId;
    let history;
    const existing = convRef.current.find((c) => c.id === convId);
    if (existing) {
      history = [...existing.messages, userMsg];
      patchConversation(convId, (c) => ({ ...c, updatedAt: Date.now(), messages: history }));
    } else {
      convId = uid();
      history = [userMsg];
      const conv = { id: convId, title: makeTitle(prompt), createdAt: Date.now(), updatedAt: Date.now(), messages: history };
      setConversations((list) => [conv, ...list]);
      setActiveId(convId);
    }
    return requestReply(convId, history, 0);
  }, [activeId, pending, remaining, patchConversation, requestReply]);

  // Replace the last assistant message (or error) with a fresh, slightly more creative answer.
  const regenerate = useCallback(async () => {
    const conv = convRef.current.find((c) => c.id === activeId);
    if (!conv || pending || remaining <= 0) return;
    const msgs = [...conv.messages];
    if (msgs.length && msgs[msgs.length - 1].role === 'assistant') msgs.pop();
    if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return;
    patchConversation(conv.id, (c) => ({ ...c, messages: msgs }));
    await requestReply(conv.id, msgs, 0.8);
  }, [activeId, pending, remaining, patchConversation, requestReply]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const newChat = useCallback(() => setActiveId(null), []);

  const rename = useCallback((id, title) => {
    const t = title.trim();
    if (t) patchConversation(id, (c) => ({ ...c, title: t }));
  }, [patchConversation]);

  const remove = useCallback((id) => {
    setConversations((list) => list.filter((c) => c.id !== id));
    setActiveId((cur) => (cur === id ? null : cur));
  }, []);

  const clearCurrent = useCallback(() => {
    if (activeId) patchConversation(activeId, (c) => ({ ...c, messages: [], updatedAt: Date.now() }));
  }, [activeId, patchConversation]);

  const clearAll = useCallback(() => {
    abortRef.current?.abort();
    setConversations([]);
    setActiveId(null);
  }, []);

  const resetUsage = useCallback(() => setUsed(0), []);

  return {
    conversations, active, activeId, setActiveId, pending, used, remaining,
    send, regenerate, stop, newChat, rename, remove, clearCurrent, clearAll, resetUsage,
  };
}
