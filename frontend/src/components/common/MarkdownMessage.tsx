'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Safely normalize HTML-style <br> or <br/> tags into markdown newlines without raw HTML rendering
  const normalizedContent = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/gi, ' ');

  return (
    <div className={`markdown-content text-slate-200 text-xs sm:text-sm leading-relaxed space-y-2.5 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base sm:text-lg font-bold text-white mt-4 mb-2 pb-1.5 border-b border-slate-800/80 flex items-center gap-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm sm:text-base font-bold text-purple-300 mt-4 mb-2 pb-1 border-b border-purple-900/30 flex items-center gap-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs sm:text-sm font-semibold text-slate-200 mt-3 mb-1.5 flex items-center gap-1.5">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-semibold text-slate-300 mt-2 mb-1">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-2.5 last:mb-0 leading-relaxed text-slate-300">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-100">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-purple-200/90">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1.5 my-2.5 pl-1.5 text-slate-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1.5 my-2.5 pl-1.5 text-slate-300">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          table: ({ children }) => (
            <div className="my-3.5 w-full overflow-x-auto rounded-xl border border-slate-800 bg-[#0d1322] shadow-sm">
              <table className="w-full text-left border-collapse text-xs min-w-full">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-900/90 border-b border-slate-800 text-purple-300 uppercase tracking-wider text-[11px] font-semibold">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-800/60 font-normal">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="transition-colors hover:bg-purple-950/20 odd:bg-slate-900/30 even:bg-slate-900/10">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 font-semibold text-slate-200 border-r last:border-r-0 border-slate-800/80">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2.5 text-slate-300 border-r last:border-r-0 border-slate-800/60 align-top">
              {children}
            </td>
          ),
          pre: ({ children }: any) => <>{children}</>,
          code: ({ inline, className, children, ...props }: any) => {
            const { node, ...rest } = props;
            const isInline =
              typeof inline === 'boolean'
                ? inline
                : !className && !String(children).includes('\n');

            if (isInline) {
              return (
                <code
                  className="bg-purple-950/70 text-purple-300 border border-purple-800/40 rounded px-1.5 py-0.5 text-[11px] font-mono whitespace-nowrap"
                  {...rest}
                >
                  {children}
                </code>
              );
            }
            return (
              <div className="my-3 rounded-xl border border-slate-800 bg-[#090d16] p-3 overflow-x-auto">
                <code
                  className={`text-xs font-mono text-purple-200 block whitespace-pre ${className || ''}`}
                  {...rest}
                >
                  {children}
                </code>
              </div>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-500/70 bg-purple-950/20 pl-3.5 py-2 my-3 text-slate-300 italic rounded-r-lg">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-slate-800/80 my-4" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 underline font-medium transition-colors"
            >
              {children}
            </a>
          ),
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
};
