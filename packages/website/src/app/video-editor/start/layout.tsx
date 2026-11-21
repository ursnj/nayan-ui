import { buildPageMetadata } from "@/services/seo";

// The page is a client component, so its metadata lives here.
export const metadata = buildPageMetadata({
  title: "Free Online Video Editor",
  description:
    "Edit video free in your browser. Multi-track timeline, green screen, colour grading, transitions and titles. Nothing is uploaded — no account, no watermark.",
  path: "/video-editor/start",
  ogType: "website",
});

/** The fullscreen editor provides its own toolbar, panels and timeline. */
export default function VideoEditorStartLayout({ children }: { children: React.ReactNode }) {
  return <div className="fullscreen-workspace video-editor-workspace">{children}</div>;
}
