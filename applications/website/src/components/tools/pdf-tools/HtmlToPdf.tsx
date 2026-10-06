"use client";

import { useCallback, useState } from "react";
import { Download, FileText, Trash2 } from "lucide-react";
import { NButton, NCard, NInput, NSelect, NTextarea, showToast } from "@nayan-ui/react";
import type { ReactSelectOption } from "@nayan-ui/react";

const PAGE_SIZES: ReactSelectOption[] = [
  { label: "A4", value: "a4" },
  { label: "Letter", value: "letter" },
  { label: "Legal", value: "legal" },
];

const HtmlToPdf = () => {
  const [html, setHtml] = useState("");
  const [title, setTitle] = useState("Document");
  const [pageSize, setPageSize] = useState<ReactSelectOption>(PAGE_SIZES[0]);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const convert = useCallback(async () => {
    if (!html.trim()) return;
    setProcessing(true);
    try {
      const form = new FormData();
      form.append("html", html);
      form.append("title", title);
      form.append("pageSize", pageSize.value);
      const res = await fetch("/api/pdf-tools/html-to-pdf", { method: "POST", body: form });
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
  }, [html, title, pageSize]);

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
        label="HTML Content"
        value={html}
        onChange={(e) => { setHtml(e.target.value); setResult(null); }}
        placeholder="Paste your HTML content here…"
        className="mb-4"
        rows={10}
      />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <NInput label="Document Title" className="mb-0" value={title} onChange={(e) => setTitle(e.target.value)} />
        <NSelect label="Page Size" className="mb-0" value={pageSize} onChange={(val) => { if (val) setPageSize(val); }} options={PAGE_SIZES} isSearchable={false} />
      </div>

      {result && (
        <NCard className="mb-4 p-3">
          <p className="text-sm text-green-600">✓ PDF generated successfully</p>
        </NCard>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <NButton onClick={convert} isLoading={processing} loadingText="Converting…" disabled={!html.trim()}>
          <FileText className="mr-2 h-4 w-4" />
          Convert to PDF
        </NButton>
        {result && (
          <NButton isOutline onClick={download}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </NButton>
        )}
        <NButton isOutline onClick={() => { setHtml(""); setResult(null); setTitle("Document"); }}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>
    </div>
  );
};

export default HtmlToPdf;
