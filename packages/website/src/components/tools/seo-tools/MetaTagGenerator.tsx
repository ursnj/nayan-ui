"use client";

import { useState, useCallback, useMemo } from "react";
import { ClipboardCopy, Trash2, Tag } from "lucide-react";
import { NButton, NCard, NInput, NTextarea, showToast } from "@nayan-ui/react";

const escapeAttr = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const MetaTagGenerator = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [url, setUrl] = useState("");
  const [image, setImage] = useState("");
  const [siteName, setSiteName] = useState("");
  const [author, setAuthor] = useState("");

  const output = useMemo(() => {
    const lines: string[] = [];
    const t = escapeAttr(title);
    const d = escapeAttr(description);
    const u = escapeAttr(url);
    const img = escapeAttr(image);
    const sn = escapeAttr(siteName);

    if (title) {
      lines.push(`<title>${t}</title>`);
      lines.push(`<meta name="title" content="${t}" />`);
    }
    if (description) lines.push(`<meta name="description" content="${d}" />`);
    if (keywords) lines.push(`<meta name="keywords" content="${escapeAttr(keywords)}" />`);
    if (author) lines.push(`<meta name="author" content="${escapeAttr(author)}" />`);
    if (url) lines.push(`<link rel="canonical" href="${u}" />`);

    if (title || description || image || url) {
      lines.push("");
      lines.push("<!-- Open Graph -->");
      lines.push(`<meta property="og:type" content="website" />`);
      if (title) lines.push(`<meta property="og:title" content="${t}" />`);
      if (description) lines.push(`<meta property="og:description" content="${d}" />`);
      if (url) lines.push(`<meta property="og:url" content="${u}" />`);
      if (image) lines.push(`<meta property="og:image" content="${img}" />`);
      if (siteName) lines.push(`<meta property="og:site_name" content="${sn}" />`);

      lines.push("");
      lines.push("<!-- Twitter -->");
      lines.push(`<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`);
      if (title) lines.push(`<meta name="twitter:title" content="${t}" />`);
      if (description) lines.push(`<meta name="twitter:description" content="${d}" />`);
      if (url) lines.push(`<meta name="twitter:url" content="${u}" />`);
      if (image) lines.push(`<meta name="twitter:image" content="${img}" />`);
    }

    return lines.join("\n");
  }, [title, description, keywords, url, image, siteName, author]);

  const copy = useCallback(() => {
    navigator.clipboard
      .writeText(output)
      .then(() => showToast("Meta tags copied to clipboard"))
      .catch(() => showToast("Failed to copy to clipboard"));
  }, [output]);

  const clear = useCallback(() => {
    setTitle(""); setDescription(""); setKeywords(""); setUrl("");
    setImage(""); setSiteName(""); setAuthor("");
  }, []);

  return (
    <div>
      <NCard className="mb-6 space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <NInput label="Title" className="mb-0" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My Awesome Website" />
          <NInput label="Page URL" className="mb-0" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/page" />
        </div>
        <NTextarea label="Description" className="mb-0" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A brief description of your page (150-160 characters)" textareaClassName="h-[80px] resize-none text-sm" />
        <div className="grid gap-3 sm:grid-cols-2">
          <NInput label="Image URL" className="mb-0" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://example.com/image.jpg" />
          <NInput label="Site Name" className="mb-0" value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="My Website" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <NInput label="Keywords" className="mb-0" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="keyword1, keyword2, keyword3" />
          <NInput label="Author" className="mb-0" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="John Doe" />
        </div>
      </NCard>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <NButton onClick={copy} disabled={!output}>
          <ClipboardCopy className="mr-2 h-4 w-4" />
          Copy Meta Tags
        </NButton>
        <NButton isOutline onClick={clear}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      {output && (
        <NCard className="p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted" />
            <label className="block text-sm font-medium">Generated Meta Tags</label>
          </div>
          <pre className="max-h-[400px] overflow-auto rounded-lg bg-default/30 p-3 font-mono text-xs text-foreground">
            {output}
          </pre>
        </NCard>
      )}
    </div>
  );
};

export default MetaTagGenerator;
