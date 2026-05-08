'use client';

import Banner from './Banner';
import CallToAction from './CallToAction';
import Features from './Features';
import Showcase from './Showcase';

const Home = () => {
  return (
    <div className="min-h-screen">
      <Banner />
      <Features />
      <Showcase />
      <CallToAction />
    </div>
  );
};

export default Home;
