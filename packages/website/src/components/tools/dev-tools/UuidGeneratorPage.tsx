import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { uuidGeneratorTags } from '@/services/Tags';
import { UuidGeneratorContent } from './DevToolsContent';

const UuidGeneratorPage = () => {
  return (
    <Sidebar title="UUID Generator">
      <UuidGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={uuidGeneratorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default UuidGeneratorPage;
