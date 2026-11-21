"use client";

import { NText } from 'nayan-ui/components';
import dynamic from "next/dynamic";

// The editor and the engine run in the browser only.
const Playground = dynamic(() => import("./NayanPlayground"), {
  ssr: false,
  loading: () => (
    <NText tag="p" className="m-auto p-10 text-center text-sm text-muted">Loading the playground…</NText>
  ),
});

export default function NayanPlaygroundLoader() {
  return <Playground />;
}
