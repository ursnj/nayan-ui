'use client';

import { NLink } from '@nayan-ui/react';
import Code from '@/helpers/Code';
import Sidebar from '@/helpers/Sidebar';
import { rnAppCode, rnCssCode, rnInstallCode, rnPeerDepsCode } from '@/services/ReactCodeBlocks';

const Installation = () => {
  return (
    <Sidebar title="Installation">
      <p className="text-muted mb-4">
        This library requires <NLink href="https://uniwind.dev/docs/installation">Uniwind</NLink> to be set up in your project. Follow the{' '}
        <NLink href="https://uniwind.dev/docs/installation">Uniwind installation guide</NLink> to configure it before proceeding.
      </p>
      <p className="text-muted mb-4">Install the library.</p>
      <Code language="bash" code={rnInstallCode} />
      <p className="text-muted mb-4">Install peer dependencies (most Expo projects already include these).</p>
      <Code language="bash" code={rnPeerDepsCode} />
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
        Configuration
      </h2>
      <p className="text-muted mb-4">
        Create a <code>global.css</code> file in your project with the following imports:
      </p>
      <Code language="css" code={rnCssCode} />
      <p className="text-muted mb-4">Import this CSS file in your app entry point.</p>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
        Usage
      </h2>
      <p className="text-muted mb-4">
        Wrap your app with the <code>NTheme</code> provider:
      </p>
      <Code code={rnAppCode} />
    </Sidebar>
  );
};

export default Installation;
