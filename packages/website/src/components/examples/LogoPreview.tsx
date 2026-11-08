"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { LogoId } from "./logos";

const loading = () => (
  <div role="status" className="flex h-full items-center justify-center text-sm text-slate-300">
    Loading Nayan Game Engine…
  </div>
);
const SCENES = {
  mercedes: dynamic(() => import("./logos/mercedes"), { ssr: false, loading }),
  cisco: dynamic(() => import("./logos/cisco"), { ssr: false, loading }),
  spotify: dynamic(() => import("./logos/spotify"), { ssr: false, loading }),
  microsoft: dynamic(() => import("./logos/microsoft"), { ssr: false, loading }),
  dropbox: dynamic(() => import("./logos/dropbox"), { ssr: false, loading }),
  figma: dynamic(() => import("./logos/figma"), { ssr: false, loading }),
  target: dynamic(() => import("./logos/target"), { ssr: false, loading }),
  nike: dynamic(() => import("./logos/nike"), { ssr: false, loading }),
  linkedin: dynamic(() => import("./logos/linkedin"), { ssr: false, loading }),
  slack: dynamic(() => import("./logos/slack"), { ssr: false, loading }),
  mitsubishi: dynamic(() => import("./logos/mitsubishi"), { ssr: false, loading }),
  netflix: dynamic(() => import("./logos/netflix"), { ssr: false, loading }),
  audi: dynamic(() => import("./logos/audi"), { ssr: false, loading }),
  adidas: dynamic(() => import("./logos/adidas"), { ssr: false, loading }),
  youtube: dynamic(() => import("./logos/youtube"), { ssr: false, loading }),
  bmw: dynamic(() => import("./logos/bmw"), { ssr: false, loading }),
  google: dynamic(() => import("./logos/google"), { ssr: false, loading }),
  mastercard: dynamic(() => import("./logos/mastercard"), { ssr: false, loading }),
};

export default function LogoPreview({ logo }: { logo: LogoId }) {
  const [controls, setControls] = useState({ playing: false, speed: 1, replay: 0 });
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.source !== window.parent ||
        event.origin !== window.location.origin ||
        event.data?.type !== "logo-controls"
      )
        return;
      const { playing, speed, replay } = event.data;
      if (
        typeof playing === "boolean" &&
        [0.5, 1, 1.5, 2].includes(speed) &&
        Number.isSafeInteger(replay)
      )
        setControls({ playing, speed, replay });
    };
    window.addEventListener("message", receive);
    window.parent.postMessage({ type: "logo-ready" }, window.location.origin);
    return () => window.removeEventListener("message", receive);
  }, []);
  const Scene = SCENES[logo];
  return (
    <div className="h-dvh bg-[#0B1020]">
      <Scene {...controls} />
    </div>
  );
}
