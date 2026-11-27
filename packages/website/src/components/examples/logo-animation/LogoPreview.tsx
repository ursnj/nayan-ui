"use client";

import { NView } from 'nayan-ui/components';
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { LOGOS, type LogoId } from "./logos";

const SharedLogoRuntime = dynamic(() => import("./SharedLogoRuntime"), {
  ssr: false,
  loading: () => null,
});

type Controls = {
  logo: LogoId;
  background: string;
  playing: boolean;
  rendering: boolean;
  speed: number;
  replay: number;
  rotateView: boolean;
  viewReset: number;
};

const send = (message: object) => window.parent.postMessage(message, window.location.origin);

export default function LogoPreview({ logo }: { logo?: LogoId } = {}) {
  const [controls, setControls] = useState<Controls | null>(null);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== window.parent || event.origin !== window.location.origin) return;
      if (event.data?.type !== "logo-controls") return;
      const { playing, speed, replay, background } = event.data;
      if (
        typeof playing !== "boolean" ||
        ![0.5, 1, 1.5, 2].includes(speed) ||
        !Number.isSafeInteger(replay)
      ) return;
      const nextLogo =
        event.data.logo === undefined
          ? logo
          : LOGOS.find((item) => item.id === event.data.logo)?.id;
      if (!nextLogo) return;
      setControls({
        logo: nextLogo,
        background:
          typeof background === "string" &&
          /^(#[\da-f]{3,8}|rgba?\([\d.,\s]+\))$/i.test(background) &&
          CSS.supports("color", background)
            ? background
            : getComputedStyle(document.body).backgroundColor,
        playing,
        speed,
        replay,
        rotateView: event.data.rotateView === true,
        viewReset: Number.isSafeInteger(event.data.viewReset) ? event.data.viewReset : 0,
        rendering: event.data.rendering !== false,
      });
    };
    window.addEventListener("message", receive);
    send({ type: "logo-ready" });
    return () => window.removeEventListener("message", receive);
  }, [logo]);

  return (
    <NView tag="div" className="h-dvh bg-background" style={{ backgroundColor: controls?.background }}>
      {controls ? (
        <SharedLogoRuntime
          {...controls}
          onReady={() => send({ type: "logo-rendered" })}
          onError={() =>
            send({
              type: "logo-error",
              message: "The engine could not start. Please reload the page.",
            })
          }
        />
      ) : null}
    </NView>
  );
}
