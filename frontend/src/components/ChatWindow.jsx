import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, BookOpen, Code2, Lightbulb, PanelLeft, Sparkles } from 'lucide-react';
import MessageBubble from './MessageBubble';
import PromptInput from './PromptInput';
import { Logo } from './Logo';
import { PROMPT_LIMIT } from '../hooks/useChat';

const SUGGESTIONS = [
  { icon: Lightbulb, title: 'Explain a concept', prompt: 'What is machine learning?' },
  { icon: Code2, title: 'Write some code', prompt: 'Write a Python function to reverse a string.' },
  { icon: BookOpen, title: 'Quick fact', prompt: 'What is the capital of France?' },
  { icon: Sparkles, title: 'Get ideas', prompt: 'Give me three tips to study better.' },
];

export default function ChatWindow({ chat, username, theme, health, sidebarOpen, onOpenSidebar, inputRef }) {
  const { active, pending, remaining } = chat;
  const messages = active?.messages || [];
  const waitingHere = pending && active && pending.convId === active.id;
  const scrollRef = useRef(null);
  const [pinned, setPinned] = useState(true); // follow new messages unless the user scrolled up

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) setPinned(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  };

  // Jump to the bottom when switching conversations.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    setPinned(true);
  }, [active?.id]);

  // Follow new messages and the typing indicator while pinned.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && pinned) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages.length, waitingHere, pinned]);

  const lastIdx = messages.length - 1;
  const status = health === 'ok' ? 'on' : health === 'checking' ? 'wait' : 'off';
  const statusText = waitingHere
    ? 'Thinking…'
    : { on: 'Online · chatgpt-mini 135M', wait: 'Connecting…', off: 'Backend offline' }[status];

  return (
    <main className="chat">
      <header className="chat-head">
        {!sidebarOpen && (
          <button type="button" className="icon-btn" onClick={onOpenSidebar} aria-label="Open sidebar" title="Open sidebar (Ctrl+B)">
            <PanelLeft size={18} />
          </button>
        )}
        <div className="chat-head__title">
          <h1>{active?.title || 'New chat'}</h1>
          <span className={`status status--${waitingHere ? 'busy' : status}`}><i />{statusText}</span>
        </div>
      </header>

      <div className="chat-scroll" ref={scrollRef} onScroll={onScroll}>
        {messages.length === 0 ? (
          <div className="welcome">
            <Logo size={48} />
            <h2>Hello, {username}</h2>
            <p>Ask anything. Follow-up questions remember the rest of this chat.</p>
            <div className="suggestions">
              {SUGGESTIONS.map(({ icon: Icon, title, prompt }) => (
                <button
                  key={title}
                  type="button"
                  className="suggestion"
                  disabled={remaining <= 0 || Boolean(pending)}
                  onClick={() => chat.send(prompt)}
                >
                  <Icon size={18} />
                  <b>{title}</b>
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="thread">
            {messages.map((m, i) => (
              <MessageBubble
                key={m.id}
                message={m}
                theme={theme}
                isLast={i === lastIdx}
                canRegenerate={!pending && remaining > 0 && m.role === 'assistant'}
                onRegenerate={chat.regenerate}
              />
            ))}
            {waitingHere && (
              <div className="msg msg--ai">
                <div className="msg__avatar"><Logo size={26} /></div>
                <div className="msg__body">
                  <div className="msg__name">Mini-GPT</div>
                  <div className="typing" aria-label="Mini-GPT is thinking"><i /><i /><i /></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!pinned && messages.length > 0 && (
        <button
          type="button"
          className="jump-btn"
          onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })}
        >
          <ArrowDown size={14} /> Latest
        </button>
      )}

      <PromptInput
        ref={inputRef}
        onSend={chat.send}
        onStop={chat.stop}
        busy={Boolean(pending)}
        remaining={remaining}
        limit={PROMPT_LIMIT}
      />
    </main>
  );
}
