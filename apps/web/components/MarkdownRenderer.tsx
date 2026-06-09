import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

// Non-greedy split on bold, italic, inline code
const INLINE_RE = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;

function parseInline(text: string, keyPrefix: string): React.ReactNode[] {
  if (!text) return [];
  const tokens = text.split(INLINE_RE);
  return tokens.map((token, i) => {
    const key = `${keyPrefix}-t${i}`;
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={key}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return <em key={key}>{token.slice(1, -1)}</em>;
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return <code key={key}>{token.slice(1, -1)}</code>;
    }
    return token;
  });
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;

    // Code blocks
    if (line.startsWith('```')) {
      const blockStart = i;
      const langHint = line.slice(3).trim();
      let codeContent = '';
      i++;
      while (i < lines.length && !lines[i]!.startsWith('```')) {
        codeContent += lines[i] + '\n';
        i++;
      }
      elements.push(
        <pre key={`code-${blockStart}`} data-lang={langHint || undefined}>
          <code>{codeContent.replace(/\n$/, '')}</code>
        </pre>
      );
      i++; // skip closing ```
      continue;
    }

    // Unordered lists
    if (/^[-*] /.test(line.trim())) {
      const listStart = i;
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i]!.trim())) {
        const itemText = lines[i]!.trim().replace(/^[-*] /, '');
        listItems.push(<li key={`li-${i}`}>{parseInline(itemText, `li-${i}`)}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${listStart}`}>{listItems}</ul>);
      continue;
    }

    // Blockquotes
    if (line.trim().startsWith('>')) {
      const quoteStart = i;
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i]!.trim().startsWith('>')) {
        quoteLines.push(lines[i]!.trim().replace(/^> ?/, ''));
        i++;
      }
      elements.push(
        <blockquote key={`bq-${quoteStart}`}>
          {quoteLines.map((ql, idx) => (
            <p key={idx}>{parseInline(ql, `bq-${quoteStart}-p${idx}`)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(<h3 key={`h3-${i}`}>{parseInline(line.slice(4), `h3-${i}`)}</h3>);
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={`h2-${i}`}>{parseInline(line.slice(3), `h2-${i}`)}</h2>);
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(<h1 key={`h1-${i}`}>{parseInline(line.slice(2), `h1-${i}`)}</h1>);
      i++;
      continue;
    }

    // Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph
    elements.push(<p key={`p-${i}`}>{parseInline(line, `p-${i}`)}</p>);
    i++;
  }

  return <div className="article-content">{elements}</div>;
}
