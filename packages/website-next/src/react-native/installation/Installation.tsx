'use client';

import { NLink } from '@nayan-ui/react';
import Code from '@/helpers/Code';
import Sidebar from '@/helpers/Sidebar';
import { rnAppCode, rnCssCode, rnInstallCode, rnPeerDepsCode } from '@/services/ReactCodeBlocks';

const Installation = () => {
  return (
    <Sidebar title="Installation">
      <div className="mb-5">
        This library requires <NLink href="https://uniwind.dev/docs/installation">Uniwind</NLink> to be set up in your project. Follow the{' '}
        <NLink href="https://uniwind.dev/docs/installation">Uniwind installation guide</NLink> to configure it before proceeding.
      </div>
      <div className="mb-5">Install the library.</div>
      <Code language="bash" code={rnInstallCode} />
      <div className="mb-5">Install peer dependencies (most Expo projects already include these).</div>
      <Code language="bash" code={rnPeerDepsCode} />
      <h1 className="text-xl mb-5"># Configuration</h1>
      <div className="mb-5">
        Create a <code>global.css</code> file in your project with the following imports:
      </div>
      <Code language="css" code={rnCssCode} />
      <div className="mb-5">Import this CSS file in your app entry point.</div>
      <h1 className="text-xl mb-5"># Usage</h1>
      <div className="mb-5">
        Wrap your app with the <code>NTheme</code> provider:
      </div>
      <Code code={rnAppCode} />
    </Sidebar>
  );
};

export default Installation;
