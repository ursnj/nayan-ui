import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { jsonToTsvTags } from '@/services/Tags';
import { JsonToTsvContent } from './JsonToolsContent';

const JsonToTsvPage = () => {
  return (
    <Sidebar title="JSON to TSV">
      <JsonToTsvContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonToTsvTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonToTsvPage;
