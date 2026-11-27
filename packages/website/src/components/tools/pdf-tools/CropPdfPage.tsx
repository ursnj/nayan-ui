import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { cropPdfTags } from '@/services/Tags';
import { CropPdfContent } from './PdfToolsContent';

const CropPdfPage = () => {
  return (
    <Sidebar title="Crop PDF">
      <CropPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={cropPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default CropPdfPage;
