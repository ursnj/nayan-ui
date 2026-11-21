import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { yamlToXmlTags } from '@/services/Tags';
import { YamlToXmlContent } from './XmlToolsContent';

const YamlToXmlPage = () => {
  return (
    <Sidebar title="YAML to XML">
      <YamlToXmlContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={yamlToXmlTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default YamlToXmlPage;
