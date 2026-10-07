"use client";

import dynamic from "next/dynamic";

const VideoEditor = dynamic(() => import("@/components/video-editor/App"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-background text-foreground">
      Loading editor…
    </div>
  ),
});

export default function VideoEditorStartPage() {
  return <VideoEditor />;
}
