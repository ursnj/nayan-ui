import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { htmlMinifierTags } from '@/services/Tags';
import { HtmlMinifierContent } from './DevToolsContent';

const HtmlMinifierPage = () => {
  return (
    <Sidebar title="HTML Minifier">
      <HtmlMinifierContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={htmlMinifierTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default HtmlMinifierPage;
