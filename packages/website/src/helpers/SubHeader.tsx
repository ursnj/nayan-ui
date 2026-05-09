import { ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
}

const SubHeader = (props: Props) => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
        <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
        {props.title}
      </h2>
      <div className="leading-relaxed">{props.children}</div>
    </div>
  );
};

export default SubHeader;
