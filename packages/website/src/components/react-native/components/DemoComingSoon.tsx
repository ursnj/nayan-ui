"use client";

import { NView, NText } from 'nayan-ui/components';
import { Smartphone } from "@/design/Icons";
import Link from "next/link";
import { ACCENT_SOFT, BUTTON_SMALL } from "@/design/system";

interface DemoComingSoonProps {
  componentName?: string;
  description?: string;
}

const DemoComingSoon = ({ componentName = "This component", description }: DemoComingSoonProps) => (
  <NView tag="div" className="flex flex-col items-start gap-4 sm:flex-row">
    <NText tag="span"
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${ACCENT_SOFT}`}
    >
      <Smartphone className="h-5 w-5" />
    </NText>
    <NView tag="div">
      <NText tag="p" className="text-sm font-semibold text-foreground">
        {componentName} renders natively, so it cannot run in this page
      </NText>
      <NText tag="p" className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
        {description ||
          "React Native components build to native iOS and Android views rather than DOM nodes. The usage example and the full prop table below are complete — and the React version shares the same prop names, if you want to see the behaviour in a browser."}
      </NText>
      <NView tag="div" className="mt-4 flex flex-wrap gap-2">
        <Link href="#usage" className={BUTTON_SMALL}>
          Jump to usage
        </Link>
        <Link href="/react/components" className={BUTTON_SMALL}>
          See the React components
        </Link>
      </NView>
    </NView>
  </NView>
);

export default DemoComingSoon;
