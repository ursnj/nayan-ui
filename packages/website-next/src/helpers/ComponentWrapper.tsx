'use client';

import { usePathname } from 'next/navigation';
import TagsList from '@/helpers/TagsList';
import { getMenuItem } from '@/services/Utils';
import Attributes from './Attributes';
import Code from './Code';
import Sidebar from './Sidebar';
import SubHeader from './SubHeader';

interface Props {
  children: any;
}

const ComponentWrapper = (props: Props) => {
  const { children } = props;
  const pathname = usePathname();
  const type = pathname.split('/')[1];
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component.title}>
      <div className="mb-5">{component.description}</div>

      <SubHeader title="Demo">{children}</SubHeader>

      <SubHeader title="Usage">
        <Code code={component.code} />
      </SubHeader>

      <Attributes data={component.attributes} />

      <SubHeader title="Tags">
        <TagsList type={type} tags={component.tags} />
      </SubHeader>
    </Sidebar>
  );
};

export default ComponentWrapper;
