import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const Bubbles = (props: Props) => {
  return (
    <div className="relative w-full md:p-16 p-4">
      <div className="absolute top-0 -left-4 w-72 h-72 bg-pink-300 rounded-full filter blur-xl opacity-90 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full filter blur-xl opacity-90 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-green-300 rounded-full filter blur-xl opacity-90 animate-blob animation-delay-4000" />
      <div className="md:m-8 m-2 relative space-y-4">{props.children}</div>
    </div>
  );
};

export default Bubbles;
