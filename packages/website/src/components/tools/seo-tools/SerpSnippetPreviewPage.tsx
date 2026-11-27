import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { serpSnippetPreviewTags } from '@/services/Tags';
import { SerpSnippetPreviewContent } from './SeoToolsContent';

const SerpSnippetPreviewPage = () => {
  return (
    <Sidebar title="Google SERP Snippet Preview">
      <SerpSnippetPreviewContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={serpSnippetPreviewTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default SerpSnippetPreviewPage;
