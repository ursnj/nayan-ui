import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { cssMinifierTags } from '@/services/Tags';
import { CssMinifierContent } from './DevToolsContent';

const CssMinifierPage = () => {
  return (
    <Sidebar title="CSS Minifier">
      <CssMinifierContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={cssMinifierTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default CssMinifierPage;
