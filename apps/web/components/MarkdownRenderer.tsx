import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

function parseInline(text: string): React.ReactNode[] {
  if (!text) return [];
  const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
  const tokens = text.split(regex);
  
  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={i}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return <em key={i}>{token.slice(1, -1)}</em>;
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return <code key={i}>{token.slice(1, -1)}</code>;
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
    const line = lines[i];
    
    // 1. Code blocks
    if (line.startsWith('```')) {
      let codeContent = '';
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeContent += lines[i] + '\n';
        i++;
      }
      // Remove trailing newline if exists
      if (codeContent.endsWith('\n')) {
        codeContent = codeContent.slice(0, -1);
      }
      elements.push(
        <pre key={`code-block-${i}`}>
          <code>{codeContent}</code>
        </pre>
      );
      i++; // skip closing ```
      continue;
    }
    
    // 2. Unordered lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        const itemText = lines[i].trim().replace(/^[-*]\s+/, '');
        listItems.push(<li key={`li-${i}`}>{parseInline(itemText)}</li>);
        i++;
      }
      elements.push(<ul key={`ul-list-${i}`}>{listItems}</ul>);
      continue;
    }
    
    // 3. Blockquotes
    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
        i++;
      }
      elements.push(
        <blockquote key={`quote-${i}`}>
          {quoteLines.map((ql, idx) => (
            <p key={idx}>{parseInline(ql)}</p>
          ))}
        </blockquote>
      );
      continue;
    }
    
    // 4. Headings
    if (line.startsWith('### ')) {
      elements.push(<h3 key={`h3-${i}`}>{parseInline(line.slice(4))}</h3>);
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={`h2-${i}`}>{parseInline(line.slice(3))}</h2>);
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(<h1 key={`h1-${i}`}>{parseInline(line.slice(2))}</h1>);
      i++;
      continue;
    }
    
    // 5. Empty line
    if (!line.trim()) {
      i++;
      continue;
    }
    
    // 6. Paragraph
    elements.push(<p key={`p-${i}`}>{parseInline(line)}</p>);
    i++;
  }

  return <div className="article-content">{elements}</div>;
}
