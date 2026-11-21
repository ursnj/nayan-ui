import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { jsonMinifierTags } from '@/services/Tags';
import { JsonMinifierContent } from './JsonToolsContent';

const JsonMinifierPage = () => {
  return (
    <Sidebar title="JSON Minifier">
      <JsonMinifierContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonMinifierTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonMinifierPage;
