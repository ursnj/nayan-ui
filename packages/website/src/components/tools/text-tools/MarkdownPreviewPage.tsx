import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { markdownPreviewTags } from '@/services/Tags';
import { MarkdownPreviewContent } from './TextToolsContent';

const MarkdownPreviewPage = () => {
  return (
    <Sidebar title="Markdown Preview">
      <MarkdownPreviewContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={markdownPreviewTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default MarkdownPreviewPage;
