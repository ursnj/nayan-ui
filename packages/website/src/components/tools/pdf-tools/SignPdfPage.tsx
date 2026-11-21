import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { signPdfTags } from '@/services/Tags';
import { SignPdfContent } from './PdfToolsContent';

const SignPdfPage = () => {
  return (
    <Sidebar title="Sign PDF">
      <SignPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={signPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default SignPdfPage;
