import { NLink } from '@nayan-ui/react';
import Code from '../../helpers/Code';
import Meta from '../../helpers/Meta';
import Sidebar from '../../helpers/Sidebar';
import {
  appCode,
  cssCode,
  installCode,
  rnAppCode,
  rnCssCode,
  rnInstallCode,
  rnPeerDepsCode,
  rnTailwindCode,
  tailwindCode
} from '../../services/ReactCodeBlocks';

const Installation = () => {
  return (
    <Sidebar title="Installation">
      <Meta title="Installation" />
      <Code language="bash" code={rnInstallCode} />
      <div className="mb-5">Install peer dependencies.</div>
      <Code language="bash" code={rnPeerDepsCode} />
      <div className="mb-5">Setup NativeWind</div>
      <div className="mb-5">
        This library depends on NativeWind for styling. Follow the{' '}
        <NLink href="https://www.nativewind.dev/docs/getting-started/installation">NativeWind installation</NLink> guide to set it up in your project.
      </div>
      <h1 className="text-xl mb-5"># Configuration</h1>
      <div className="mb-5">Include module in `tailwind.config.js` to read tailwind classes, this will help in reusing same tailwind classes.</div>
      <Code code={rnTailwindCode} />
      <div className="mb-5">Create theme colors configuration file.</div>
      <Code code={rnCssCode} />
      <h1 className="text-xl mb-5"># Usage</h1>
      <Code code={rnAppCode} />
    </Sidebar>
  );
};

export default Installation;
