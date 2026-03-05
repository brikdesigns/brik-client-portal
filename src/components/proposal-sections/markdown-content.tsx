'use client';

import ReactMarkdown from 'react-markdown';

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div
      style={{
        fontFamily: 'var(--_typography---font-family--body)',
        fontSize: '14px',
        lineHeight: 1.7,
        color: 'var(--_color---text--primary)',
      }}
    >
      <ReactMarkdown
        components={{
          h2: ({ children }) => (
            <h2 style={{
              fontFamily: 'var(--_typography---font-family--heading)',
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--_color---text--primary)',
              margin: '24px 0 8px',
            }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 style={{
              fontFamily: 'var(--_typography---font-family--heading)',
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--_color---text--primary)',
              margin: '20px 0 8px',
            }}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p style={{ margin: '0 0 12px', lineHeight: 1.7 }}>{children}</p>
          ),
          ul: ({ children }) => (
            <ul style={{ paddingLeft: '24px', margin: '0 0 12px' }}>{children}</ul>
          ),
          li: ({ children }) => (
            <li style={{ marginBottom: '4px' }}>{children}</li>
          ),
          strong: ({ children }) => (
            <strong style={{ fontWeight: 600 }}>{children}</strong>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
