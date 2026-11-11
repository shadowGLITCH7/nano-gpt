const DAY = 24 * 60 * 60 * 1000;

const startOfDay = (t) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// Today / Yesterday / Previous 7 Days / Older, newest first inside each group.
export function groupConversations(list) {
  const today = startOfDay(Date.now());
  const groups = { Today: [], Yesterday: [], 'Previous 7 Days': [], Older: [] };
  [...list]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .forEach((c) => {
      const t = c.updatedAt;
      if (t >= today) groups.Today.push(c);
      else if (t >= today - DAY) groups.Yesterday.push(c);
      else if (t >= today - 7 * DAY) groups['Previous 7 Days'].push(c);
      else groups.Older.push(c);
    });
  return Object.entries(groups).filter(([, items]) => items.length);
}

export function relativeTime(t) {
  const diff = Date.now() - t;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const clockTime = (t) =>
  new Date(t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
