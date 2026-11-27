import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { jsonToYamlTags } from '@/services/Tags';
import { JsonToYamlContent } from './JsonToolsContent';

const JsonToYamlPage = () => {
  return (
    <Sidebar title="JSON to YAML">
      <JsonToYamlContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonToYamlTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonToYamlPage;
