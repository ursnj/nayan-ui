import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { jsonToTypescriptTags } from '@/services/Tags';
import { JsonToTypescriptContent } from './JsonToolsContent';

const JsonToTypescriptPage = () => {
  return (
    <Sidebar title="JSON to TypeScript">
      <JsonToTypescriptContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonToTypescriptTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonToTypescriptPage;
