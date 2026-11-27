import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { imageToBase64Tags } from '@/services/Tags';
import { ImageToBase64Content } from './ImageToolsContent';

const ImageToBase64Page = () => {
  return (
    <Sidebar title="Image to Base64">
      <ImageToBase64Content />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={imageToBase64Tags} />
      </SubHeader>
    </Sidebar>
  );
};

export default ImageToBase64Page;
