import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { hashGeneratorTags } from '@/services/Tags';
import { HashGeneratorContent } from './TextToolsContent';

const HashGeneratorPage = () => {
  return (
    <Sidebar title="Hash Generator">
      <HashGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={hashGeneratorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default HashGeneratorPage;
