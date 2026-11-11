import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import UsageCounter from './UsageCounter';

const PromptInput = forwardRef(function PromptInput({ onSend, onStop, busy, remaining, limit }, ref) {
  const [text, setText] = useState('');
  const taRef = useRef(null);
  const exhausted = remaining <= 0;

  useImperativeHandle(ref, () => ({ focus: () => taRef.current?.focus() }));

  // Grow with content up to ~8 lines, then scroll.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 220)}px`;
  }, [text]);

  const submit = () => {
    if (!text.trim() || busy || exhausted) return;
    onSend(text);
    setText('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="composer-wrap">
      <div className={`composer${exhausted ? ' is-disabled' : ''}`}>
        <textarea
          ref={taRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={exhausted}
          placeholder={exhausted ? 'Demo allowance used up. Reset it in Settings to keep chatting.' : 'Message Mini-GPT'}
          aria-label="Prompt"
        />
        {busy ? (
          <button type="button" className="send-btn send-btn--stop" onClick={onStop} aria-label="Stop generating">
            <Square size={14} fill="currentColor" />
          </button>
        ) : (
          <button
            type="button"
            className="send-btn"
            onClick={submit}
            disabled={!text.trim() || exhausted}
            aria-label="Send message"
          >
            <ArrowUp size={18} strokeWidth={2.4} />
          </button>
        )}
      </div>
      <div className="composer-foot">
        <UsageCounter remaining={remaining} limit={limit} />
        <span className="disclaimer">
          AI responses may contain mistakes. <kbd>Shift</kbd> + <kbd>Enter</kbd> for a new line.
        </span>
      </div>
    </div>
  );
});

export default PromptInput;
