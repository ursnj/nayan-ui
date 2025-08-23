import Footer from '../helpers/Footer';
import Meta from '../helpers/Meta';
import Banner from './Banner';
import CallToAction from './CallToAction';
import Features from './Features';
import Showcase from './Showcase';
import Stats from './Stats';
import Testimonials from './Testimonials';

const Home = () => {
  return (
    <div className="min-h-screen">
      <Meta
        title="Modern React & React Native Component Library"
        description="Build beautiful, accessible, and performant applications with our comprehensive collection of React and React Native components. Designed for modern development workflows."
        keywords="react components, react native, ui library, component library, design system, typescript, accessibility, cross-platform"
      />

      {/* Hero Section */}
      <Banner />

      {/* Stats Section */}
      {/*<Stats />*/}

      {/* Features Section */}
      <Features />

      {/* Component Showcase */}
      <Showcase />

      {/* Testimonials */}
      {/*<Testimonials />*/}

      {/* Call to Action */}
      <CallToAction />
    </div>
  );
};

export default Home;
