import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { pdfToImageTags } from '@/services/Tags';
import { PdfToImageContent } from './PdfToolsContent';

const PdfToImagePage = () => {
  return (
    <Sidebar title="PDF to Image">
      <PdfToImageContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={pdfToImageTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default PdfToImagePage;
