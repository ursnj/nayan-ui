import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { slugGeneratorTags } from '@/services/Tags';
import { SlugGeneratorContent } from './TextToolsContent';

const SlugGeneratorPage = () => {
  return (
    <Sidebar title="Slug Generator">
      <SlugGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={slugGeneratorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default SlugGeneratorPage;
