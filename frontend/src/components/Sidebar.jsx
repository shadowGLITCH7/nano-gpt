import { forwardRef, useMemo, useState } from 'react';
import { Check, MessageSquare, PanelLeftClose, Pencil, Search, Settings, SquarePen, Trash2, X } from 'lucide-react';
import { Logo } from './Logo';
import { groupConversations, relativeTime } from '../lib/time';

function ConversationItem({ conv, active, onSelect, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(conv.title);

  const commit = () => {
    onRename(conv.id, draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <form className="conv conv--editing" onSubmit={(e) => { e.preventDefault(); commit(); }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
          aria-label="Conversation name"
          autoFocus
          maxLength={80}
        />
        <button type="submit" className="icon-btn icon-btn--sm" aria-label="Save name"><Check size={15} /></button>
        <button type="button" className="icon-btn icon-btn--sm" onClick={() => setEditing(false)} aria-label="Cancel rename"><X size={15} /></button>
      </form>
    );
  }

  return (
    <div className={`conv${active ? ' is-active' : ''}`}>
      <button type="button" className="conv__main" onClick={() => onSelect(conv.id)} aria-current={active ? 'page' : undefined}>
        <span className="conv__title">{conv.title}</span>
        <span className="conv__meta">
          {relativeTime(conv.updatedAt)} · {conv.messages.length} message{conv.messages.length === 1 ? '' : 's'}
        </span>
      </button>
      <div className="conv__actions">
        <button
          type="button"
          className="icon-btn icon-btn--sm"
          onClick={() => { setDraft(conv.title); setEditing(true); }}
          aria-label={`Rename ${conv.title}`}
          title="Rename"
        >
          <Pencil size={14} />
        </button>
        <button type="button" className="icon-btn icon-btn--sm" onClick={() => onDelete(conv)} aria-label={`Delete ${conv.title}`} title="Delete">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

const Sidebar = forwardRef(function Sidebar(
  { chat, username, onClose, onNewChat, onSelect, onDelete, onOpenSettings },
  searchRef,
) {
  const [query, setQuery] = useState('');
  const { conversations, activeId, remaining } = chat;

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? conversations.filter(
          (c) => c.title.toLowerCase().includes(q) || c.messages.some((m) => m.content.toLowerCase().includes(q)),
        )
      : conversations;
    return groupConversations(list);
  }, [conversations, query]);

  const initials = username.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className="sidebar" aria-label="Conversation history">
      <div className="sidebar__top">
        <div className="brand">
          <Logo size={26} />
          <span>Mini-GPT</span>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close sidebar" title="Close sidebar (Ctrl+B)">
          <PanelLeftClose size={18} />
        </button>
      </div>

      <button type="button" className="btn btn--new" onClick={onNewChat} title="New chat (Ctrl+Shift+O)">
        <SquarePen size={16} /> New chat
      </button>

      <label className="search">
        <Search size={15} />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chats"
          aria-label="Search chats"
        />
        {query && (
          <button type="button" className="icon-btn icon-btn--sm" onClick={() => setQuery('')} aria-label="Clear search">
            <X size={14} />
          </button>
        )}
      </label>

      <nav className="conv-list">
        {groups.length === 0 && (
          <div className="conv-empty">
            <MessageSquare size={18} />
            {query ? `No chats match “${query}”.` : 'Your chats will show up here.'}
          </div>
        )}
        {groups.map(([label, items]) => (
          <section key={label} className="conv-group">
            <h3>{label}</h3>
            {items.map((c) => (
              <ConversationItem
                key={c.id}
                conv={c}
                active={c.id === activeId}
                onSelect={onSelect}
                onRename={chat.rename}
                onDelete={onDelete}
              />
            ))}
          </section>
        ))}
      </nav>

      <button type="button" className="profile" onClick={onOpenSettings} aria-label="Open settings">
        <span className="avatar">{initials}</span>
        <span className="profile__text">
          <b>{username}</b>
          <span>{remaining} prompts left</span>
        </span>
        <Settings size={17} />
      </button>
    </aside>
  );
});

export default Sidebar;
