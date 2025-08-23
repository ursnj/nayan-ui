import { useLocation } from 'react-router-dom';
import SubHeader from '@/helpers/SubHeader';
import Meta from '../helpers/Meta';
import Sidebar from '../helpers/Sidebar';
import { robotsTags } from '../services/Tags';
import { getMenuItem } from '../services/Utils';
import TagsList from '../tags/TagsList';
import Robots from './Robots';

const RobotsPage = () => {
  const location = useLocation();
  const component: any = getMenuItem(location.pathname);

  return (
    <Sidebar title={component?.title || 'Robots.txt Generator'}>
      <Meta
        title="Robots.txt Generator - Nayan UI CLI Tools"
        description="Create and validate robots.txt files for search engine crawling control. Manage how search engines crawl and index your website with Nayan UI CLI tools."
        keywords="robots.txt generator, robots.txt validator, search engine crawling, web crawlers, SEO tools, search engine optimization"
      />

      <Robots />

      <SubHeader title="Tags">
        <TagsList type="devtools" tags={robotsTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default RobotsPage;
