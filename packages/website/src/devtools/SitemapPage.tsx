'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/helpers/Sidebar';
import SubHeader from '@/helpers/SubHeader';
import TagsList from '@/helpers/TagsList';
import { sitemapTags } from '@/services/Tags';
import { getMenuItem } from '@/services/Utils';
import Sitemaps from './Sitemaps';

const SitemapPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || 'Sitemap Generator'}>
      <Sitemaps />

      <SubHeader title="Tags">
        <TagsList type="devtools" tags={sitemapTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default SitemapPage;
