import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { imageToPdfTags } from '@/services/Tags';
import { ImageToPdfContent } from './PdfToolsContent';

const ImageToPdfPage = () => {
  return (
    <Sidebar title="Image to PDF">
      <ImageToPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={imageToPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default ImageToPdfPage;
