import { LogOut, Moon, RotateCcw, Sun, Trash2, Eraser } from 'lucide-react';
import { Modal } from './Modal';
import { PROMPT_LIMIT } from '../hooks/useChat';

export const APP_VERSION = '1.0.0';

export default function SettingsPanel({ theme, setTheme, chat, healthInfo, onClose, onConfirm, onLogout }) {
  const { used, remaining, active, conversations } = chat;

  return (
    <Modal title="Settings" onClose={onClose} size="md">
      <div className="settings">
        <section>
          <h3>Appearance</h3>
          <div className="segmented" role="radiogroup" aria-label="Theme">
            {[['dark', 'Dark', Moon], ['light', 'Light', Sun]].map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={theme === value}
                className={theme === value ? 'is-on' : ''}
                onClick={() => setTheme(value)}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3>Demo usage</h3>
          <div className="stats">
            <div><b>{used}</b><span>prompts used</span></div>
            <div><b>{remaining}</b><span>of {PROMPT_LIMIT} remaining</span></div>
            <div><b>{conversations.length}</b><span>saved chats</span></div>
          </div>
          <button
            type="button"
            className="row-btn"
            onClick={() => onConfirm({
              title: 'Reset demo usage?',
              body: `Your allowance goes back to ${PROMPT_LIMIT} prompts. Your chats are not affected.`,
              confirmLabel: 'Reset usage',
              danger: false,
              action: 'resetUsage',
            })}
          >
            <RotateCcw size={16} /> Reset demo usage to {PROMPT_LIMIT}
          </button>
        </section>

        <section>
          <h3>Data</h3>
          <button
            type="button"
            className="row-btn"
            disabled={!active || active.messages.length === 0}
            onClick={() => onConfirm({
              title: 'Clear this conversation?',
              body: `All messages in “${active?.title}” will be removed. This can’t be undone.`,
              confirmLabel: 'Clear messages',
              action: 'clearCurrent',
            })}
          >
            <Eraser size={16} /> Clear current conversation
          </button>
          <button
            type="button"
            className="row-btn row-btn--danger"
            disabled={conversations.length === 0}
            onClick={() => onConfirm({
              title: 'Delete all conversations?',
              body: `All ${conversations.length} chats will be permanently deleted from this browser. This can’t be undone.`,
              confirmLabel: 'Delete all',
              action: 'clearAll',
            })}
          >
            <Trash2 size={16} /> Delete all conversation history
          </button>
        </section>

        <section>
          <h3>Account</h3>
          <button type="button" className="row-btn" onClick={onLogout}>
            <LogOut size={16} /> Log out
          </button>
        </section>

        <footer className="about">
          <b>Mini-GPT {APP_VERSION}</b>
          <span>
            Model: {healthInfo?.model || 'chatgpt-mini (backend offline)'}
            {healthInfo && ` · context ${healthInfo.max_context_tokens} tokens`}
          </span>
          <span>React + FastAPI · chats are stored in this browser only.</span>
        </footer>
      </div>
    </Modal>
  );
}
