'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/helpers/Sidebar';
import SubHeader from '@/helpers/SubHeader';
import TagsList from '@/helpers/TagsList';
import { robotsTags } from '@/services/Tags';
import { getMenuItem } from '@/services/Utils';
import Robots from './Robots';

const RobotsPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || 'Robots.txt Generator'}>
      <Robots />

      <SubHeader title="Tags">
        <TagsList type="devtools" tags={robotsTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default RobotsPage;
