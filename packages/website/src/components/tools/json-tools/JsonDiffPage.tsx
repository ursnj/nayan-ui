import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { jsonDiffTags } from '@/services/Tags';
import { JsonDiffContent } from './JsonToolsContent';

const JsonDiffPage = () => {
  return (
    <Sidebar title="JSON Diff">
      <JsonDiffContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonDiffTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonDiffPage;
