import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { markdownToPdfTags } from '@/services/Tags';
import { MarkdownToPdfContent } from './PdfToolsContent';

const MarkdownToPdfPage = () => {
  return (
    <Sidebar title="Markdown to PDF">
      <MarkdownToPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={markdownToPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default MarkdownToPdfPage;
