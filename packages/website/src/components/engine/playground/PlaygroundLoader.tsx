"use client";

import dynamic from "next/dynamic";

// The editor and the engine run in the browser only.
const Playground = dynamic(() => import("./Playground"), {
  ssr: false,
  loading: () => (
    <p className="m-auto p-10 text-center text-sm text-muted">Loading the playground…</p>
  ),
});

export default function PlaygroundLoader() {
  return <Playground />;
}
