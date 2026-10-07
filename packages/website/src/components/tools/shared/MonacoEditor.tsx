"use client";

import { memo, useCallback } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { NLoading } from "@nayan-ui/react";

export interface MonacoEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  language?: string;
  height?: string;
  label?: string;
}

const resolveColor = (cssVar: string): string => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  if (!raw) return "#888888";
  if (raw.startsWith("#") || raw.startsWith("rgb")) return raw;
  if (raw.startsWith("oklch") || raw.startsWith("hsl") || raw.startsWith("lch")) {
    const el = document.createElement("div");
    el.style.color = raw;
    document.body.appendChild(el);
    const computed = getComputedStyle(el).color;
    document.body.removeChild(el);
    return computed;
  }
  return raw;
};

const buildTheme = (isDark: boolean) => {
  const surface = resolveColor("--surface");
  const defaultColor = resolveColor("--default");
  const muted = resolveColor("--muted");
  const foreground = resolveColor("--foreground");
  const accent = resolveColor("--accent");

  return {
    base: (isDark ? "vs-dark" : "vs") as "vs-dark" | "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: muted.replace("#", "") },
      { token: "string", foreground: accent.replace("#", "") },
    ],
    colors: {
      "editor.background": surface,
      "editor.foreground": foreground,
      "editor.lineHighlightBackground": defaultColor,
      "editor.selectionBackground": `${accent}33`,
      "editor.inactiveSelectionBackground": `${accent}1a`,
      "editorLineNumber.foreground": muted,
      "editorLineNumber.activeForeground": foreground,
      "editorCursor.foreground": accent,
      "editorWidget.background": surface,
      "editorWidget.border": defaultColor,
      "editorSuggestWidget.background": surface,
      "editorSuggestWidget.border": defaultColor,
      "editorSuggestWidget.selectedBackground": defaultColor,
      "input.background": surface,
      "input.border": defaultColor,
      "input.foreground": foreground,
      "scrollbarSlider.background": `${muted}40`,
      "scrollbarSlider.hoverBackground": `${muted}60`,
      "scrollbarSlider.activeBackground": `${muted}80`,
    },
  };
};

const THEME_NAME = "nayan-theme";

const MonacoEditor = memo(
  ({ value, onChange, readOnly = false, language = "plaintext", height = "500px", label }: MonacoEditorProps) => {
    const handleMount: OnMount = useCallback((editor, monaco) => {
      const applyTheme = () => {
        const isDark = document.documentElement.classList.contains("dark");
        monaco.editor.defineTheme(THEME_NAME, buildTheme(isDark));
        monaco.editor.setTheme(THEME_NAME);
      };

      applyTheme();

      const observer = new MutationObserver(applyTheme);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
      editor.onDidDispose(() => observer.disconnect());
    }, []);

    return (
      <div className="mb-3">
        {label && <label className="mb-1.5 block text-sm font-medium">{label}</label>}
        <div className="overflow-hidden rounded-lg border border-default">
          <Editor
            height={height}
            language={language}
            value={value}
            onChange={(val) => onChange?.(val ?? "")}
            onMount={handleMount}
            loading={<NLoading className="h-20" />}
            options={{
              readOnly,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 13,
              fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
              lineNumbers: "on",
              renderLineHighlight: "line",
              tabSize: 2,
              automaticLayout: true,
              wordWrap: "on",
              padding: { top: 12, bottom: 12 },
              scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8, alwaysConsumeMouseWheel: false },
              domReadOnly: readOnly,
            }}
          />
        </div>
      </div>
    );
  },
);

MonacoEditor.displayName = "MonacoEditor";

export default MonacoEditor;
