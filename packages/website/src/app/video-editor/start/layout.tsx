import "@/components/video-editor/index.css";

/**
 * The video editor renders fullscreen — it manages its own chrome (TopBar,
 * panels, timeline). The root layout's Header, Footer and the `mt-[60px]`
 * on `<main>` are hidden with a global style injected from here.
 *
 * Its stylesheet is imported here rather than from App.tsx: Tailwind's
 * custom `@utility`/`@theme inline` directives in that CSS file only get
 * compiled when the file is reached from a standard, eagerly-processed
 * layout/page import (the same path globals.css uses) — a JS import deep
 * inside a client-only, next/dynamic-loaded component does not run through
 * the same Tailwind build pass, silently dropping every `@utility` class
 * (`.island`, `.panel`, `.elevate`, `.checkerboard`, `.gpu-layer`,
 * `.animate-in`) used throughout the editor's components.
 */
export default function VideoEditorStartLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        header.fixed { display: none !important; }
        main.mt-\\[60px\\] { margin-top: 0 !important; }
        footer { display: none !important; }
      `}</style>
      {children}
    </>
  );
}
