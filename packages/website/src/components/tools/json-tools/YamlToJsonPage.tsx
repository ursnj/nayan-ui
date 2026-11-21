import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { yamlToJsonTags } from '@/services/Tags';
import { YamlToJsonContent } from './JsonToolsContent';

const YamlToJsonPage = () => {
  return (
    <Sidebar title="YAML to JSON">
      <YamlToJsonContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={yamlToJsonTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default YamlToJsonPage;
