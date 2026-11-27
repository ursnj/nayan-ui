import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { pdfToMarkdownTags } from '@/services/Tags';
import { PdfToMarkdownContent } from './PdfToolsContent';

const PdfToMarkdownPage = () => {
  return (
    <Sidebar title="PDF to Markdown">
      <PdfToMarkdownContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={pdfToMarkdownTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default PdfToMarkdownPage;
