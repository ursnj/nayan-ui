"use client";

import Link from "next/link";
import { DocsIntro } from "@/design/Primitives";
import { ACCENT_TEXT } from "@/design/system";
import Code from "@/helpers/Code";
import Sidebar from "@/helpers/Sidebar";
import SubHeader from "@/helpers/SubHeader";
import { rnAppCode, rnCssCode, rnInstallCode, rnPeerDepsCode } from "@/services/ReactCodeBlocks";

const Installation = () => (
  <Sidebar title="Installation">
    <DocsIntro
      lead={
        <>
          Built on HeroUI Native and styled with Uniwind. Set{" "}
          <Link
            href="https://uniwind.dev/docs/installation"
            target="_blank"
            rel="noopener noreferrer"
            className={`font-medium ${ACCENT_TEXT}`}
          >
            Uniwind
          </Link>{" "}
          up in your project first — the components will not style correctly without it.
        </>
      }
    />

    <SubHeader
      title="Install"
      description="The library, then its peer dependencies — most Expo projects already carry these."
    >
      <Code language="bash" code={rnInstallCode} filename="terminal" />
      <div className="mt-4">
        <Code language="bash" code={rnPeerDepsCode} filename="terminal" />
      </div>
    </SubHeader>

    <SubHeader
      title="Configuration"
      description="Create a global stylesheet and import it from your entry point."
    >
      <Code language="css" code={rnCssCode} filename="global.css" />
    </SubHeader>

    <SubHeader title="Usage" description="Wrap your app in the NTheme provider.">
      <Code code={rnAppCode} filename="App.tsx" />
    </SubHeader>
  </Sidebar>
);

export default Installation;
