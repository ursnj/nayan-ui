import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { pdfInfoTags } from '@/services/Tags';
import { PdfInfoContent } from './PdfToolsContent';

const PdfInfoPage = () => {
  return (
    <Sidebar title="PDF Info">
      <PdfInfoContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={pdfInfoTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default PdfInfoPage;
