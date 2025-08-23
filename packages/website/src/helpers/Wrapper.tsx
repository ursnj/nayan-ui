import React, { ReactNode } from 'react';
import Footer from '@/helpers/Footer';
import Header from './Header';

interface Props {
  children: ReactNode;
}

const Wrapper = (props: Props) => {
  return (
    <>
      <Header />
      <div className="main mt-[58px]">{props.children}</div>
      <Footer />
    </>
  );
};

export default Wrapper;
