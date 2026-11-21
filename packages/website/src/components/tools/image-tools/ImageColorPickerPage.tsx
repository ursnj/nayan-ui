import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { imageColorPickerTags } from '@/services/Tags';
import { ImageColorPickerContent } from './ImageToolsContent';

const ImageColorPickerPage = () => {
  return (
    <Sidebar title="Image Color Picker">
      <ImageColorPickerContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={imageColorPickerTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default ImageColorPickerPage;
