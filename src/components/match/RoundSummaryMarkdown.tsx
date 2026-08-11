"use client";

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

interface RoundSummaryMarkdownProps {
  content: string;
}

const components: Components = {
  img: ({ src, alt }) => (
    <img
      src={src || ""}
      alt={alt || ""}
      className="w-5 h-5 object-contain inline-block align-middle mx-1 rounded-full bg-zinc-800 p-0.5 shadow-sm"
    />
  ),
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-white mb-3 mt-1 leading-snug">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-bold text-white mb-2 mt-4 leading-snug">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-bold text-white mb-2 mt-4 leading-snug">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-purple-500 bg-purple-500/10 rounded-r-xl px-4 py-3 my-3 text-purple-200 italic">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-bold text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-purple-400 underline hover:text-purple-300"
    >
      {children}
    </a>
  ),
};

export function RoundSummaryMarkdown({
  content,
}: RoundSummaryMarkdownProps) {
  return (
    <div className="text-zinc-300 text-sm leading-relaxed font-sans">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
