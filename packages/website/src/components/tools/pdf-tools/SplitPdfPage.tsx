import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { splitPdfTags } from '@/services/Tags';
import { SplitPdfContent } from './PdfToolsContent';

const SplitPdfPage = () => {
  return (
    <Sidebar title="Split PDF">
      <SplitPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={splitPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default SplitPdfPage;
