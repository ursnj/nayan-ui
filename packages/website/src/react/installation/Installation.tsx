'use client';

import { DocsIntro } from '@/design/Primitives';
import Code from '@/helpers/Code';
import Sidebar from '@/helpers/Sidebar';
import SubHeader from '@/helpers/SubHeader';
import { appCode, cssCode, installCode, tailwindCode } from '@/services/ReactCodeBlocks';

/**
 * Installing the React package.
 *
 * The headings were bare `h2`s with a gradient rule beside them — purple for
 * Configuration, emerald for Usage — and the steps ran together with no
 * structure beyond those two colours. They are `SubHeader`s now, so they are
 * anchored, sit on the same rule as every other section on the site, and read
 * as three ordered steps rather than a page of code blocks.
 */
const Installation = () => (
  <Sidebar title="Installation">
    <DocsIntro lead="One dependency and one stylesheet import. Tailwind v4 needs no configuration file, and there is no CLI step or code generation to run." />

    <SubHeader title="Install" description="Add the package to your project.">
      <Code language="bash" code={installCode} filename="terminal" />
    </SubHeader>

    <SubHeader title="Configuration" description="Wire Tailwind up, then import the library's styles and theme tokens.">
      <Code code={tailwindCode} filename="vite.config.ts" />
      <p className="mb-4 mt-6 text-sm leading-relaxed text-muted">
        Add the library styles to <code className="font-mono text-xs text-foreground">index.css</code>. The theme colour variables can be overridden
        here for both light and dark modes.
      </p>
      <Code language="css" code={cssCode} filename="index.css" />
    </SubHeader>

    <SubHeader title="Usage" description="Wrap the tree in NTheme once; components can then be imported anywhere.">
      <Code code={appCode} filename="App.tsx" />
    </SubHeader>
  </Sidebar>
);

export default Installation;
