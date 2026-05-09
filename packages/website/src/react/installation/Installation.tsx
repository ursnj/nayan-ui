'use client';

import Code from '@/helpers/Code';
import Sidebar from '@/helpers/Sidebar';
import { appCode, cssCode, installCode, tailwindCode } from '@/services/ReactCodeBlocks';

const Installation = () => {
  return (
    <Sidebar title="Installation">
      <Code language="bash" code={installCode} />
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
        Configuration
      </h2>
      <p className="text-muted mb-4">
        Include module in `tailwind.config.js` to read tailwind classes, this will help in reusing same tailwind classes.
      </p>
      <Code code={tailwindCode} />
      <p className="text-muted mb-4">
        Add library styles to `index.css`, and update theme color variables accordingly for both light and dark modes.
      </p>
      <Code code={cssCode} />
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
        Usage
      </h2>
      <Code code={appCode} />
    </Sidebar>
  );
};

export default Installation;
