import { ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
}

const SubHeader = (props: Props) => {
  return (
    <div className="mb-5">
      <div className="text-lg mb-5"># {props.title}</div>
      <div className="leading-relaxed">{props.children}</div>
    </div>
  );
};

export default SubHeader;
