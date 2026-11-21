import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { pptToPdfTags } from '@/services/Tags';
import { PptToPdfContent } from './PdfToolsContent';

const PptToPdfPage = () => {
  return (
    <Sidebar title="PowerPoint to PDF">
      <PptToPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={pptToPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default PptToPdfPage;
