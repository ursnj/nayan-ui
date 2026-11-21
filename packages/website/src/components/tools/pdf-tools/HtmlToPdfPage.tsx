import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { htmlToPdfTags } from '@/services/Tags';
import { HtmlToPdfContent } from './PdfToolsContent';

const HtmlToPdfPage = () => {
  return (
    <Sidebar title="HTML to PDF">
      <HtmlToPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={htmlToPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default HtmlToPdfPage;
