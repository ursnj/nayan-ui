import Code from '../../helpers/Code';
import Meta from '../../helpers/Meta';
import Sidebar from '../../helpers/Sidebar';
import { appCode, cssCode, installCode, tailwindCode } from '../../services/ReactCodeBlocks';

const Installation = () => {
  return (
    <Sidebar title="Installation">
      <Meta title="Installation" />
      <Code language="bash" code={installCode} />
      <h1 className="text-xl mb-5"># Configuration</h1>
      <div className="mb-5">Include module in `tailwind.config.js` to read tailwind classes, this will help in reusing same tailwind classes.</div>
      <Code code={tailwindCode} />
      <div className="mb-5">Add library styles to `index.css`, and update theme color variables accordingly for both light and dark modes.</div>
      <Code code={cssCode} />
      <h1 className="text-xl mb-5"># Usage</h1>
      <Code code={appCode} />
    </Sidebar>
  );
};

export default Installation;
