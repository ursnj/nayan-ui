import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { pageNumbersPdfTags } from '@/services/Tags';
import { PageNumbersPdfContent } from './PdfToolsContent';

const PageNumbersPdfPage = () => {
  return (
    <Sidebar title="Page Numbers">
      <PageNumbersPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={pageNumbersPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default PageNumbersPdfPage;
