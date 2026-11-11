import { useCallback, useEffect, useRef, useState } from 'react';
import { Login } from './components/Login';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import SettingsPanel from './components/SettingsPanel';
import { ConfirmDialog, Modal } from './components/Modal';
import { ToastProvider, useToast } from './components/Toast';
import { getSession, logout } from './lib/auth';
import { load, save } from './lib/storage';
import { getHealth } from './lib/api';
import { PROMPT_LIMIT, useChat } from './hooks/useChat';

const isMobile = () => window.matchMedia('(max-width: 860px)').matches;

function useTheme() {
  const [theme, setTheme] = useState(() => load('minigpt:theme', 'dark'));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    save('minigpt:theme', theme);
  }, [theme]);
  return [theme, setTheme];
}

function useHealth() {
  const [state, setState] = useState({ status: 'checking', info: null });
  useEffect(() => {
    let alive = true;
    const check = () =>
      getHealth()
        .then((info) => alive && setState({ status: 'ok', info }))
        .catch(() => alive && setState((s) => ({ status: 'off', info: s.info })));
    check();
    const t = setInterval(check, 15000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  return state;
}

function ChatApp({ username, onLogout, theme, setTheme }) {
  const chat = useChat(username);
  const toast = useToast();
  const health = useHealth();
  const [sidebarOpen, setSidebarOpen] = useState(() => load('minigpt:sidebar', true) && !isMobile());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [limitModal, setLimitModal] = useState(false);
  const inputRef = useRef(null);
  const searchRef = useRef(null);
  const prevRemaining = useRef(chat.remaining);

  useEffect(() => { if (!isMobile()) save('minigpt:sidebar', sidebarOpen); }, [sidebarOpen]);

  // Show the limit notice once, at the moment the allowance runs out.
  useEffect(() => {
    if (prevRemaining.current > 0 && chat.remaining === 0) setLimitModal(true);
    prevRemaining.current = chat.remaining;
  }, [chat.remaining]);

  const closeOnMobile = () => isMobile() && setSidebarOpen(false);

  const newChat = useCallback(() => {
    chat.newChat();
    if (isMobile()) setSidebarOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [chat]);

  const select = (id) => {
    chat.setActiveId(id);
    closeOnMobile();
  };

  const runAction = ({ action, conv }) => {
    if (action === 'delete') { chat.remove(conv.id); toast('Chat deleted'); }
    if (action === 'clearCurrent') { chat.clearCurrent(); toast('Conversation cleared'); }
    if (action === 'clearAll') { chat.clearAll(); toast('All chats deleted'); }
    if (action === 'resetUsage') { chat.resetUsage(); toast(`Usage reset to ${PROMPT_LIMIT} prompts`); }
  };

  // Keyboard shortcuts: Ctrl+Shift+O new chat, Ctrl+K search, Ctrl+B sidebar.
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (e.shiftKey && k === 'o') { e.preventDefault(); newChat(); }
      else if (k === 'k') {
        e.preventDefault();
        setSidebarOpen(true);
        requestAnimationFrame(() => searchRef.current?.focus());
      } else if (k === 'b') { e.preventDefault(); setSidebarOpen((o) => !o); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [newChat]);

  return (
    <div className={`app${sidebarOpen ? ' sidebar-open' : ''}`}>
      <div className="sidebar-shell">
        <Sidebar
          ref={searchRef}
          chat={chat}
          username={username}
          onClose={() => setSidebarOpen(false)}
          onNewChat={newChat}
          onSelect={select}
          onDelete={(conv) => setConfirm({
            title: 'Delete this chat?',
            body: `“${conv.title}” and all its messages will be deleted. This can’t be undone.`,
            confirmLabel: 'Delete',
            action: 'delete',
            conv,
          })}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </div>
      <div className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-hidden="true" />

      <ChatWindow
        chat={chat}
        username={username}
        theme={theme}
        health={health.status}
        sidebarOpen={sidebarOpen}
        onOpenSidebar={() => setSidebarOpen(true)}
        inputRef={inputRef}
      />

      {settingsOpen && !confirm && (
        <SettingsPanel
          theme={theme}
          setTheme={setTheme}
          chat={chat}
          healthInfo={health.info}
          onClose={() => setSettingsOpen(false)}
          onConfirm={setConfirm}
          onLogout={onLogout}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          body={confirm.body}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger !== false}
          onConfirm={() => runAction(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {limitModal && (
        <Modal title="Demo allowance used up" onClose={() => setLimitModal(false)}>
          <p className="modal__body">
            You’ve used all {PROMPT_LIMIT} demo prompts. This is a pretend limit for the demo: reset it in
            Settings to keep chatting. Your chats are still saved.
          </p>
          <footer className="modal__actions">
            <button className="btn btn--ghost" onClick={() => setLimitModal(false)}>Close</button>
            <button
              className="btn btn--primary"
              onClick={() => { setLimitModal(false); setSettingsOpen(true); }}
            >
              Open settings
            </button>
          </footer>
        </Modal>
      )}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(getSession);
  const [theme, setTheme] = useTheme();

  const doLogout = () => {
    logout();
    setSession(null);
  };

  return (
    <ToastProvider>
      {session ? (
        <ChatApp key={session.username} username={session.username} onLogout={doLogout} theme={theme} setTheme={setTheme} />
      ) : (
        <Login onLogin={setSession} />
      )}
    </ToastProvider>
  );
}
