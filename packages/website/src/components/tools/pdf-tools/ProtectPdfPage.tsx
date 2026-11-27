import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { protectPdfTags } from '@/services/Tags';
import { ProtectPdfContent } from './PdfToolsContent';

const ProtectPdfPage = () => {
  return (
    <Sidebar title="Protect PDF">
      <ProtectPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={protectPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default ProtectPdfPage;
