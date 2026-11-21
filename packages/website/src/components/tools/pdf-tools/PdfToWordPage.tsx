import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { pdfToWordTags } from '@/services/Tags';
import { PdfToWordContent } from './PdfToolsContent';

const PdfToWordPage = () => {
  return (
    <Sidebar title="PDF to Word">
      <PdfToWordContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={pdfToWordTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default PdfToWordPage;
