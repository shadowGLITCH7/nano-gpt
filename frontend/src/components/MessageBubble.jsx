import { memo, useState } from 'react';
import { Check, CircleAlert, Copy, RotateCcw } from 'lucide-react';
import { Markdown } from './Markdown';
import { Logo } from './Logo';
import { useToast } from './Toast';
import { copyText } from '../lib/clipboard';
import { clockTime } from '../lib/time';

function MessageBubble({ message, isLast, canRegenerate, onRegenerate, theme }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  if (message.role === 'user') {
    return (
      <div className="msg msg--user">
        <div className="bubble">{message.content}</div>
        <time className="msg__time">{clockTime(message.createdAt)}</time>
      </div>
    );
  }

  const copy = async () => {
    if (await copyText(message.content)) {
      setCopied(true);
      toast('Response copied');
      setTimeout(() => setCopied(false), 1600);
    }
  };

  const earlier = (message.contextMessages || 1) - 1;

  return (
    <div className={`msg msg--ai${message.error ? ' msg--error' : ''}`}>
      <div className="msg__avatar"><Logo size={26} /></div>
      <div className="msg__body">
        <div className="msg__name">Mini-GPT <time>{clockTime(message.createdAt)}</time></div>
        {message.error ? (
          <div className="error-box"><CircleAlert size={16} /> {message.content}</div>
        ) : (
          <Markdown text={message.content} theme={theme} />
        )}
        <div className="msg__actions">
          {!message.error && (
            <button type="button" className="chip" onClick={copy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
          {isLast && canRegenerate && (
            <button type="button" className="chip" onClick={onRegenerate}>
              <RotateCcw size={14} />
              {message.error ? 'Retry' : 'Regenerate'}
            </button>
          )}
          {!message.error && earlier > 0 && (
            <span className="ctx-note" title="Earlier messages from this chat that were sent to the model as context">
              Remembered {earlier} earlier message{earlier === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(MessageBubble);
