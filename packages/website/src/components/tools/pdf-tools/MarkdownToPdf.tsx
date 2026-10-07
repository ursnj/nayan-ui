"use client";

import { useCallback, useRef, useState } from "react";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { NButton, NCard, NInput, NSelect, NTextarea, showToast } from "@nayan-ui/react";
import type { ReactSelectOption } from "@nayan-ui/react";

const PAGE_SIZES: ReactSelectOption[] = [
  { label: "A4", value: "a4" },
  { label: "Letter", value: "letter" },
  { label: "Legal", value: "legal" },
];

const MarkdownToPdf = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [markdown, setMarkdown] = useState("");
  const [title, setTitle] = useState("Document");
  const [pageSize, setPageSize] = useState<ReactSelectOption>(PAGE_SIZES[0]);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(async (f: File) => {
    const text = await f.text();
    setMarkdown(text);
    setTitle(f.name.replace(/\.[^.]+$/, ""));
    setResult(null);
  }, []);

  const convert = useCallback(async () => {
    if (!markdown.trim()) return;
    setProcessing(true);
    try {
      const form = new FormData();
      form.append("markdown", markdown);
      form.append("title", title);
      form.append("pageSize", pageSize.value);
      const res = await fetch("/api/pdf-tools/markdown-to-pdf", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Conversion failed" }));
        throw new Error(data.error);
      }
      setResult(await res.blob());
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Conversion failed");
    } finally {
      setProcessing(false);
    }
  }, [markdown, title, pageSize]);

  const download = useCallback(() => {
    if (!result) return;
    const url = URL.createObjectURL(result);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.trim().replace(/[^a-zA-Z0-9-_]/g, "_") || "document"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, title]);

  return (
    <div>
      <NTextarea
        label="Markdown Content"
        value={markdown}
        onChange={(e) => { setMarkdown(e.target.value); setResult(null); }}
        placeholder="Type or paste your Markdown content here…"
        className="mb-6"
        rows={12}
      />

      <div className="mb-6 grid grid-cols-2 gap-3">
        <NInput label="Document Title" className="mb-0" value={title} onChange={(e) => setTitle(e.target.value)} />
        <NSelect label="Page Size" className="mb-0" value={pageSize} onChange={(val) => { if (val) setPageSize(val); }} options={PAGE_SIZES} isSearchable={false} />
      </div>

      {result && (
        <NCard className="mb-6 p-3">
          <p className="text-sm text-green-600">✓ PDF generated successfully</p>
        </NCard>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <NButton onClick={convert} isLoading={processing} loadingText="Converting…" disabled={!markdown.trim()}>
          <FileText className="mr-2 h-4 w-4" />
          Convert to PDF
        </NButton>
        {result && (
          <NButton isOutline onClick={download}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </NButton>
        )}
        <NButton isOutline onClick={() => inputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Upload .md File
        </NButton>
        <NButton isOutline onClick={() => { setMarkdown(""); setResult(null); setTitle("Document"); }}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
        <input ref={inputRef} type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      </div>
    </div>
  );
};

export default MarkdownToPdf;
