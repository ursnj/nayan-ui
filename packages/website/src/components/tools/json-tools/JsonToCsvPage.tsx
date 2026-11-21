import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { jsonToCsvTags } from '@/services/Tags';
import { JsonToCsvContent } from './JsonToolsContent';

const JsonToCsvPage = () => {
  return (
    <Sidebar title="JSON to CSV">
      <JsonToCsvContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonToCsvTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonToCsvPage;
