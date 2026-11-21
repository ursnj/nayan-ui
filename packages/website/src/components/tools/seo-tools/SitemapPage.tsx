import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { sitemapTags } from '@/services/Tags';
import { SitemapGeneratorContent } from './SeoToolsContent';

const SitemapPage = () => {
  return (
    <Sidebar title="Sitemap Generator">
      <SitemapGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={sitemapTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default SitemapPage;
