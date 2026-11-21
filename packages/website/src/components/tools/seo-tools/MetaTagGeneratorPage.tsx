import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { metaTagGeneratorTags } from '@/services/Tags';
import { MetaTagGeneratorContent } from './SeoToolsContent';

const MetaTagGeneratorPage = () => {
  return (
    <Sidebar title="Meta Tag Generator">
      <MetaTagGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={metaTagGeneratorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default MetaTagGeneratorPage;
