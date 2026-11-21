import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { imageExifViewerTags } from '@/services/Tags';
import { ImageExifViewerContent } from './ImageToolsContent';

const ImageExifViewerPage = () => {
  return (
    <Sidebar title="Image EXIF Viewer">
      <ImageExifViewerContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={imageExifViewerTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default ImageExifViewerPage;
