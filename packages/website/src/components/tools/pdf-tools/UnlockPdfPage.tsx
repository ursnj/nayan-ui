import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { unlockPdfTags } from '@/services/Tags';
import { UnlockPdfContent } from './PdfToolsContent';

const UnlockPdfPage = () => {
  return (
    <Sidebar title="Unlock PDF">
      <UnlockPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={unlockPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default UnlockPdfPage;
