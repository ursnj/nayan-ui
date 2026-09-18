import Capabilities from './Capabilities';
import Choosing from './Choosing';
import ClosingCta from './ClosingCta';
import Comparison from './Comparison';
import Faq from './Faq';
import Features from './Features';
import Hero from './Hero';
import JumpNav from './JumpNav';
import Shortcuts from './Shortcuts';
import Sizes from './Sizes';
import Specs from './Specs';
import Workflow from './Workflow';

/**
 * The /video-editor landing page.
 *
 * Every section is a server component and none of them hold state, so the
 * page ships no JavaScript of its own: the copy is in the delivered HTML, the
 * FAQ opens with `<details>`, and the jump navigation is plain anchors. That
 * is the whole reason this stopped being a client component — a marketing
 * page that needs hydrating to be read is paying twice for nothing.
 */
const VideoEditorMain = () => (
  <>
    <Hero />
    <JumpNav />
    <Features />
    <Capabilities />
    <Workflow />
    <Sizes />
    <Choosing />
    <Comparison />
    <Shortcuts />
    <Specs />
    <Faq />
    <ClosingCta />
  </>
);

export default VideoEditorMain;
