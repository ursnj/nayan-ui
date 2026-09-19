import { useEffect, useState } from "react";
import { NAlert } from "@nayan-ui/react";
import { AlertTypes } from "@nayan-ui/react";
import { Clapperboard, Monitor } from "lucide-react";
import { MIN_APP_WIDTH } from "../../lib/viewport";

/** Shown in place of the editor when the window is too narrow for it. */
export const SmallScreenNotice = () => {
  const [width, setWidth] = useState(() => (typeof window === "undefined" ? 0 : window.innerWidth));

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-5 flex items-center justify-center gap-2">
          <Clapperboard className="h-6 w-6 text-accent" />
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Nayan UI Video Editor
          </span>
        </div>

        <div className="mb-5 flex justify-center">
          <div className="rounded-2xl border border-border bg-surface-secondary p-5">
            <Monitor className="h-10 w-10 text-muted" />
          </div>
        </div>

        <NAlert
          type={AlertTypes.WARNING}
          title="This screen is too narrow"
          message={`Nayan UI Video Editor needs a window at least ${MIN_APP_WIDTH}px wide. Yours is currently ${width}px. Please open it on a laptop or desktop — or widen this window — to carry on.`}
          className="text-left"
        />

        <p className="mt-4 text-xs leading-relaxed text-muted">
          The timeline, preview and inspector sit side by side, and there is no useful way to fold
          three columns into a phone. Nothing is lost — reopen this page on a larger screen and pick
          up where you left off.
        </p>
      </div>
    </div>
  );
};
