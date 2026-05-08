import { ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
}

const SubHeader = (props: Props) => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-4 text-foreground"># {props.title}</h2>
      <div className="leading-relaxed">{props.children}</div>
    </div>
  );
};

export default SubHeader;
