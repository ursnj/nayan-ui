import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { pdfToExcelTags } from '@/services/Tags';
import { PdfToExcelContent } from './PdfToolsContent';

const PdfToExcelPage = () => {
  return (
    <Sidebar title="PDF to Excel">
      <PdfToExcelContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={pdfToExcelTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default PdfToExcelPage;
