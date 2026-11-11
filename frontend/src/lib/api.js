// Talks to the FastAPI backend (proxied by Vite at /api).

// Frontend-side context window: only the current conversation, newest messages first,
// capped by a rough character budget. The backend trims again by real token count.
const MAX_CONTEXT_MESSAGES = 12;
const MAX_CONTEXT_CHARS = 4000;

export function buildContext(messages) {
  const usable = messages.filter((m) => !m.error && m.content.trim());
  const picked = [];
  let chars = 0;
  for (let i = usable.length - 1; i >= 0; i--) {
    const m = usable[i];
    if (picked.length && (picked.length >= MAX_CONTEXT_MESSAGES || chars + m.content.length > MAX_CONTEXT_CHARS)) break;
    picked.unshift({ role: m.role, content: m.content });
    chars += m.content.length;
  }
  // The model expects the history to start with a user turn.
  while (picked.length && picked[0].role !== 'user') picked.shift();
  return picked;
}

export async function sendChat(messages, { temperature = 0, signal } = {}) {
  let res;
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, temperature }),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error('Cannot reach the backend. Is the FastAPI server running on port 8000?');
  }
  if (!res.ok) {
    let detail = `Server error (${res.status})`;
    try {
      const body = await res.json();
      if (body.detail) detail = typeof body.detail === 'string' ? body.detail : detail;
    } catch { /* not JSON */ }
    throw new Error(detail);
  }
  return res.json();
}

export async function getHealth() {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error('unhealthy');
  return res.json();
}
