"use client";

import { useState, useMemo, useCallback } from "react";
import { ClipboardCopy, Trash2 } from "lucide-react";
import { NButton, NTextarea, NCard, showToast } from "@nayan-ui/react";

function decodeBase64Url(str: string): string {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return decodeURIComponent(
    atob(s)
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
  );
}

const JwtDecoder = () => {
  const [token, setToken] = useState("");

  const decoded = useMemo(() => {
    if (!token.trim()) return null;
    try {
      const parts = token.trim().split(".");
      if (parts.length !== 3) return { error: "Invalid JWT: expected 3 parts separated by dots" };
      const header = JSON.parse(decodeBase64Url(parts[0]));
      const payload = JSON.parse(decodeBase64Url(parts[1]));
      const isExpired = payload.exp ? payload.exp * 1000 < Date.now() : null;
      return { header, payload, signature: parts[2], isExpired };
    } catch {
      return { error: "Failed to decode JWT. Make sure it is a valid token." };
    }
  }, [token]);

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  }, []);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton isOutline onClick={() => setToken("")}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      <NTextarea
        label="JWT Token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Paste your JWT token here..."
        textareaClassName="h-[120px] resize-none font-mono text-sm"
      />

      {decoded && "error" in decoded && (
        <p className="mt-3 text-sm text-danger">{decoded.error}</p>
      )}

      {decoded && !("error" in decoded) && (
        <div className="mt-4 space-y-3">
          <NCard className="p-4">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium">Header</label>
              <NButton
                isOutline
                onClick={() => copy(JSON.stringify(decoded.header, null, 2))}
                className="h-7 px-2 text-xs"
              >
                <ClipboardCopy className="mr-1 h-3 w-3" />
                Copy
              </NButton>
            </div>
            <pre className="whitespace-pre-wrap rounded-lg bg-default/30 p-3 font-mono text-sm text-foreground">
              {JSON.stringify(decoded.header, null, 2)}
            </pre>
          </NCard>
          <NCard className="p-4">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Payload</label>
                {decoded.isExpired === true && (
                  <span className="rounded bg-danger/20 px-1.5 py-0.5 text-xs text-danger">Expired</span>
                )}
                {decoded.isExpired === false && (
                  <span className="rounded bg-accent/20 px-1.5 py-0.5 text-xs text-accent">Valid</span>
                )}
              </div>
              <NButton
                isOutline
                onClick={() => copy(JSON.stringify(decoded.payload, null, 2))}
                className="h-7 px-2 text-xs"
              >
                <ClipboardCopy className="mr-1 h-3 w-3" />
                Copy
              </NButton>
            </div>
            <pre className="whitespace-pre-wrap rounded-lg bg-default/30 p-3 font-mono text-sm text-foreground">
              {JSON.stringify(decoded.payload, null, 2)}
            </pre>
            {decoded.payload.exp && (
              <p className="mt-2 text-xs text-muted">
                Expires: {new Date(decoded.payload.exp * 1000).toLocaleString()}
              </p>
            )}
            {decoded.payload.iat && (
              <p className="text-xs text-muted">
                Issued: {new Date(decoded.payload.iat * 1000).toLocaleString()}
              </p>
            )}
          </NCard>
          <NCard className="p-4">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium">Signature</label>
              <NButton isOutline onClick={() => copy(decoded.signature)} className="h-7 px-2 text-xs">
                <ClipboardCopy className="mr-1 h-3 w-3" />
                Copy
              </NButton>
            </div>
            <code className="block break-all rounded-lg bg-default/30 p-3 font-mono text-xs text-foreground">
              {decoded.signature}
            </code>
          </NCard>
        </div>
      )}
    </div>
  );
};

export default JwtDecoder;
