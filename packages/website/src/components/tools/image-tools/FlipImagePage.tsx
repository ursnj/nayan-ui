import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { flipImageTags } from '@/services/Tags';
import { FlipImageContent } from './ImageToolsContent';

const FlipImagePage = () => {
  return (
    <Sidebar title="Flip Image">
      <FlipImageContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={flipImageTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default FlipImagePage;
