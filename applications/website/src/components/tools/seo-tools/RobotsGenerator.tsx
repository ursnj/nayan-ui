"use client";

import { useState, useCallback, useMemo } from "react";
import { Download, Bot, Plus, Trash2 } from "lucide-react";
import { NButton, NCard, NInput, showToast } from "@nayan-ui/react";

interface RuleGroup {
  userAgent: string;
  allow: string[];
  disallow: string[];
}

// Directives are newline-delimited; a stray pasted newline in a field would
// otherwise inject extra, unintended lines into the generated file.
const singleLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

const buildRobotsTxt = (groups: RuleGroup[], sitemapUrl: string, crawlDelay: string): string => {
  let content = "";

  for (const group of groups) {
    content += `User-agent: ${singleLine(group.userAgent) || "*"}\n`;
    for (const path of group.disallow) {
      const p = singleLine(path);
      if (p) content += `Disallow: ${p}\n`;
    }
    if (group.disallow.length === 0 || group.disallow.every((p) => !p.trim())) {
      content += `Disallow:\n`;
    }
    for (const path of group.allow) {
      const p = singleLine(path);
      if (p) content += `Allow: ${p}\n`;
    }
    const delay = singleLine(crawlDelay);
    if (delay) {
      content += `Crawl-delay: ${delay}\n`;
    }
    content += "\n";
  }

  const sitemap = singleLine(sitemapUrl);
  if (sitemap) {
    content += `Sitemap: ${sitemap}\n`;
  }

  return content;
};

const RobotsGenerator = () => {
  const [groups, setGroups] = useState<RuleGroup[]>([
    { userAgent: "*", allow: ["/"], disallow: ["/admin", "/private"] },
  ]);
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [crawlDelay, setCrawlDelay] = useState("");

  const output = useMemo(
    () => buildRobotsTxt(groups, sitemapUrl, crawlDelay),
    [groups, sitemapUrl, crawlDelay],
  );

  const updateGroup = useCallback(
    (gi: number, field: keyof RuleGroup, value: string) => {
      setGroups((prev) => prev.map((g, i) => (i === gi ? { ...g, [field]: value } : g)));
    },
    [],
  );

  const updatePath = useCallback(
    (gi: number, field: "allow" | "disallow", pi: number, value: string) => {
      setGroups((prev) =>
        prev.map((g, i) =>
          i === gi ? { ...g, [field]: g[field].map((p, j) => (j === pi ? value : p)) } : g,
        ),
      );
    },
    [],
  );

  const addPath = useCallback((gi: number, field: "allow" | "disallow") => {
    setGroups((prev) =>
      prev.map((g, i) => (i === gi ? { ...g, [field]: [...g[field], ""] } : g)),
    );
  }, []);

  const removePath = useCallback((gi: number, field: "allow" | "disallow", pi: number) => {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === gi ? { ...g, [field]: g[field].filter((_, j) => j !== pi) } : g,
      ),
    );
  }, []);

  const addGroup = useCallback(() => {
    setGroups((prev) => [...prev, { userAgent: "*", allow: [], disallow: [""] }]);
  }, []);

  const removeGroup = useCallback((gi: number) => {
    setGroups((prev) => prev.filter((_, i) => i !== gi));
  }, []);

  const download = useCallback(() => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "robots.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [output]);

  const copy = useCallback(() => {
    navigator.clipboard
      .writeText(output)
      .then(() => showToast("robots.txt copied to clipboard"))
      .catch(() => showToast("Failed to copy to clipboard"));
  }, [output]);

  return (
    <div>
      <div className="mb-6 space-y-4">
        {groups.map((group, gi) => (
          <NCard key={gi} className="space-y-3 p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <NInput
                  label="User-agent"
                  value={group.userAgent}
                  onChange={(e) => updateGroup(gi, "userAgent", e.target.value)}
                  placeholder="*"
                />
              </div>
              {groups.length > 1 && (
                <NButton isOutline onClick={() => removeGroup(gi)} className="shrink-0">
                  <Trash2 className="h-4 w-4" />
                </NButton>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Disallow Paths</label>
              {group.disallow.map((path, pi) => (
                <div key={pi} className="mb-2 flex items-center gap-2">
                  <NInput
                    value={path}
                    onChange={(e) => updatePath(gi, "disallow", pi, e.target.value)}
                    placeholder="/admin"
                  />
                  <NButton isOutline onClick={() => removePath(gi, "disallow", pi)} className="shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </NButton>
                </div>
              ))}
              <NButton isOutline onClick={() => addPath(gi, "disallow")} className="mt-1">
                <Plus className="mr-1 h-3 w-3" /> Add Disallow
              </NButton>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Allow Paths</label>
              {group.allow.map((path, pi) => (
                <div key={pi} className="mb-2 flex items-center gap-2">
                  <NInput
                    value={path}
                    onChange={(e) => updatePath(gi, "allow", pi, e.target.value)}
                    placeholder="/public"
                  />
                  <NButton isOutline onClick={() => removePath(gi, "allow", pi)} className="shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </NButton>
                </div>
              ))}
              <NButton isOutline onClick={() => addPath(gi, "allow")} className="mt-1">
                <Plus className="mr-1 h-3 w-3" /> Add Allow
              </NButton>
            </div>
          </NCard>
        ))}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <NInput
          label="Sitemap URL"
          className="mb-0"
          value={sitemapUrl}
          onChange={(e) => setSitemapUrl(e.target.value)}
          placeholder="https://example.com/sitemap.xml"
        />
        <NInput
          label="Crawl-delay (seconds)"
          className="mb-0"
          value={crawlDelay}
          onChange={(e) => setCrawlDelay(e.target.value)}
          placeholder="10"
        />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <NButton isOutline onClick={addGroup}>
          <Plus className="mr-2 h-4 w-4" />
          Add User-agent Group
        </NButton>
        <NButton onClick={download}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </NButton>
        <NButton isOutline onClick={copy}>
          Copy
        </NButton>
        <NButton
          isOutline
          onClick={() => {
            setGroups([{ userAgent: "*", allow: ["/"], disallow: ["/admin", "/private"] }]);
            setSitemapUrl("");
            setCrawlDelay("");
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      <NCard className="p-4">
        <div className="mb-1.5 flex items-center gap-2">
          <Bot className="h-4 w-4 text-muted" />
          <label className="block text-sm font-medium">Generated robots.txt</label>
        </div>
        <pre className="max-h-[400px] overflow-auto rounded-lg bg-default/30 p-3 font-mono text-xs text-foreground">
          {output}
        </pre>
      </NCard>
    </div>
  );
};

export default RobotsGenerator;
