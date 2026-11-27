import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { xmlToYamlTags } from '@/services/Tags';
import { XmlToYamlContent } from './XmlToolsContent';

const XmlToYamlPage = () => {
  return (
    <Sidebar title="XML to YAML">
      <XmlToYamlContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={xmlToYamlTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default XmlToYamlPage;
