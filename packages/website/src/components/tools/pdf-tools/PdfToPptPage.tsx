import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { pdfToPptTags } from '@/services/Tags';
import { PdfToPptContent } from './PdfToolsContent';

const PdfToPptPage = () => {
  return (
    <Sidebar title="PDF to PowerPoint">
      <PdfToPptContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={pdfToPptTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default PdfToPptPage;
