import Banner from './Banner';
import CallToAction from './CallToAction';
import Features from './Features';
import Showcase from './Showcase';

/**
 * The home page: what it is, why you would use it, what else is here, and
 * where to start.
 *
 * `QuickStart` is gone. It put three code blocks on the front page — an npm
 * command, a CSS import and a theme provider — which is documentation wearing
 * a homepage costume. The hero still carries the one install line worth
 * showing, and the installation guide is one click from every call to action.
 * Dropping it took about 900px of scroll with it.
 */
const Home = () => (
  <>
    <Banner />
    <Features />
    <Showcase />
    <CallToAction />
  </>
);

export default Home;
