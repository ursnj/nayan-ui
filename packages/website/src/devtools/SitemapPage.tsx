import { useLocation } from 'react-router-dom';
import SubHeader from '@/helpers/SubHeader';
import Meta from '../helpers/Meta';
import Sidebar from '../helpers/Sidebar';
import { sitemapTags } from '../services/Tags';
import { getMenuItem } from '../services/Utils';
import TagsList from '../tags/TagsList';
import Sitemaps from './Sitemaps';

const SitemapPage = () => {
  const location = useLocation();
  const component: any = getMenuItem(location.pathname);

  return (
    <Sidebar title={component?.title || 'Sitemap Generator'}>
      <Meta
        title="Sitemap Generator - Nayan UI CLI Tools"
        description="Generate and validate XML sitemaps for better SEO optimization. Create comprehensive sitemaps for your website with Nayan UI CLI tools."
        keywords="sitemap generator, XML sitemap, SEO optimization, website sitemap, sitemap validator, search engine optimization"
      />

      <Sitemaps />

      <SubHeader title="Tags">
        <TagsList type="devtools" tags={sitemapTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default SitemapPage;
