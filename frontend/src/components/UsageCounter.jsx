export default function UsageCounter({ remaining, limit }) {
  const pct = Math.max(0, Math.min(100, (remaining / limit) * 100));
  const level = remaining === 0 ? 'empty' : remaining <= 10 ? 'low' : 'ok';
  return (
    <div className={`usage usage--${level}`} title="Fictional demo allowance, not a real limit">
      <div className="usage__bar"><span style={{ width: `${pct}%` }} /></div>
      <span><b>{remaining}</b> / {limit} prompts remaining</span>
    </div>
  );
}
