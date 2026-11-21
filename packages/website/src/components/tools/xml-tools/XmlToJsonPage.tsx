import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { xmlToJsonTags } from '@/services/Tags';
import { XmlToJsonContent } from './XmlToolsContent';

const XmlToJsonPage = () => {
  return (
    <Sidebar title="XML to JSON">
      <XmlToJsonContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={xmlToJsonTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default XmlToJsonPage;
