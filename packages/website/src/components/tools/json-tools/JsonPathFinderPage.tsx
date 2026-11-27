import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { jsonPathFinderTags } from '@/services/Tags';
import { JsonPathFinderContent } from './JsonToolsContent';

const JsonPathFinderPage = () => {
  return (
    <Sidebar title="JSON Path Finder">
      <JsonPathFinderContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonPathFinderTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonPathFinderPage;
