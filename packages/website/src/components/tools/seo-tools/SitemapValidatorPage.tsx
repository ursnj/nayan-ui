import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { sitemapValidatorTags } from '@/services/Tags';
import { SitemapValidatorContent } from './SeoToolsContent';

const SitemapValidatorPage = () => {
  return (
    <Sidebar title="Sitemap Validator">
      <SitemapValidatorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={sitemapValidatorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default SitemapValidatorPage;
