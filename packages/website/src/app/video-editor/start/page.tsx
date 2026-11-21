"use client";

import { NView } from 'nayan-ui/components';
import dynamic from "next/dynamic";

const VideoEditor = dynamic(() => import("@/components/nayan-video-editor/App"), {
  ssr: false,
  loading: () => (
    <NView tag="div" className="flex h-screen items-center justify-center bg-background text-foreground">
      Loading editor…
    </NView>
  ),
});

export default function VideoEditorStartPage() {
  return <VideoEditor />;
}
