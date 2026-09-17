import Banner from './Banner';
import CallToAction from './CallToAction';
import Features from './Features';
import QuickStart from './QuickStart';
import Showcase from './Showcase';

/**
 * The home page, in the order a visitor's questions arrive: what is it, why
 * would I use it, how do I start, what is in it, and which platform.
 *
 * `QuickStart` is new to this order. Previously the page pitched for four
 * sections and only mentioned installation in passing at the very bottom, so
 * the one thing a developer comes to a library's front page for was the last
 * thing it offered.
 *
 * No longer a client component — `Banner` marks itself one because it holds
 * the demo's state, and the rest of the page is static.
 */
const Home = () => (
  <>
    <Banner />
    <Features />
    <QuickStart />
    <Showcase />
    <CallToAction />
  </>
);

export default Home;
