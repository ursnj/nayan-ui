import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { rotateImageTags } from '@/services/Tags';
import { RotateImageContent } from './ImageToolsContent';

const RotateImagePage = () => {
  return (
    <Sidebar title="Rotate Image">
      <RotateImageContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={rotateImageTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default RotateImagePage;
