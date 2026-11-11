import { memo, useState } from 'react';
import { copyText } from '../lib/clipboard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import c from 'react-syntax-highlighter/dist/esm/languages/prism/c';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import { Check, Copy } from 'lucide-react';
import { useToast } from './Toast';

const LANGS = { python, javascript, typescript, jsx, tsx, java, c, cpp, sql, markup, css, bash, json };
Object.entries(LANGS).forEach(([name, def]) => SyntaxHighlighter.registerLanguage(name, def));

const ALIASES = {
  py: 'python', js: 'javascript', ts: 'typescript', 'c++': 'cpp', html: 'markup', xml: 'markup',
  sh: 'bash', shell: 'bash', zsh: 'bash', console: 'bash',
};
const LABELS = { cpp: 'C++', markup: 'HTML', javascript: 'JavaScript', typescript: 'TypeScript', sql: 'SQL', css: 'CSS', json: 'JSON' };

// Small models often indent the whole code block; remove the shared leading whitespace.
function dedent(code) {
  const lines = code.split('\n');
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^[ \t]*/)[0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return min ? lines.map((l) => l.slice(min)).join('\n') : code;
}

function CodeBlock({ lang, code, theme }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const key = ALIASES[lang] || lang;
  const known = key && LANGS[key];
  const label = LABELS[key] || (lang ? lang.charAt(0).toUpperCase() + lang.slice(1) : 'Code');

  const onCopy = async () => {
    if (await copyText(code)) {
      setCopied(true);
      toast('Code copied');
      setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <div className="code">
      <div className="code__head">
        <span>{label}</span>
        <button className="code__copy" onClick={onCopy} aria-label="Copy code">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy code'}
        </button>
      </div>
      <SyntaxHighlighter
        language={known ? key : 'text'}
        style={theme === 'light' ? oneLight : oneDark}
        customStyle={{ margin: 0, background: 'transparent', padding: '14px 16px', fontSize: '0.84rem' }}
        codeTagProps={{ style: { fontFamily: 'var(--font-mono)', background: 'transparent' } }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export const Markdown = memo(function Markdown({ text, theme }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-([\w+#-]+)/.exec(className || '');
            const content = dedent(String(children).replace(/\n$/, ''));
            const isBlock = match || content.includes('\n');
            if (!isBlock) return <code className="inline-code" {...props}>{children}</code>;
            return <CodeBlock lang={match?.[1]?.toLowerCase()} code={content} theme={theme} />;
          },
          pre: ({ children }) => <>{children}</>,
          a: ({ children, ...props }) => <a {...props} target="_blank" rel="noreferrer">{children}</a>,
          table: ({ children }) => <div className="md__table"><table>{children}</table></div>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
});
