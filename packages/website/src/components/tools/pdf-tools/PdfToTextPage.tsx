import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { pdfToTextTags } from '@/services/Tags';
import { PdfToTextContent } from './PdfToolsContent';

const PdfToTextPage = () => {
  return (
    <Sidebar title="PDF to Text">
      <PdfToTextContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={pdfToTextTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default PdfToTextPage;
