"use client";

import { useState, useMemo } from "react";
import MonacoEditor from "../shared/MonacoEditor";

const escHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const safeUrl = (url: string) =>
  /^(https?:|mailto:|\/|#)/i.test(url.trim()) ? url : "#";

const markdownToHtml = (md: string): string => {
  let html = escHtml(md);

  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");
  html = html.replace(/`(.+?)`/g, "<code>$1</code>");

  html = html.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/^---$/gm, "<hr />");

  html = html.replace(
    /\[(.+?)\]\((.+?)\)/g,
    (_, text, url) => `<a href="${safeUrl(url)}" target="_blank" rel="noopener">${text}</a>`,
  );
  html = html.replace(/!\[(.+?)\]\((.+?)\)/g, (_, alt, url) => `<img alt="${alt}" src="${safeUrl(url)}" />`);

  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);

  html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

  html = html.replace(/\n\n/g, "</p><p>");
  html = html.replace(/\n/g, "<br />");
  html = `<p>${html}</p>`;
  html = html.replace(/<p><\/p>/g, "");

  return html;
};

const DEFAULT_MD = `# Heading 1
## Heading 2
### Heading 3

This is a paragraph with **bold**, *italic*, and ~~strikethrough~~ text.

- List item 1
- List item 2
- List item 3

> This is a blockquote

\`inline code\` and [a link](https://example.com)

---

Another paragraph with some text.`;

const MarkdownPreview = () => {
  const [input, setInput] = useState(DEFAULT_MD);

  const html = useMemo(() => markdownToHtml(input), [input]);

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-2">
        <MonacoEditor
          label="Markdown Input"
          value={input}
          onChange={setInput}
          language="markdown"
          height="500px"
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium">Preview</label>
          <div
            className="prose prose-sm dark:prose-invert h-[500px] overflow-auto rounded-lg border border-default bg-surface p-4"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
};

export default MarkdownPreview;
