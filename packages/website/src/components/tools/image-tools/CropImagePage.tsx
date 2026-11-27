import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { cropImageTags } from '@/services/Tags';
import { CropImageContent } from './ImageToolsContent';

const CropImagePage = () => {
  return (
    <Sidebar title="Crop Image">
      <CropImageContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={cropImageTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default CropImagePage;
