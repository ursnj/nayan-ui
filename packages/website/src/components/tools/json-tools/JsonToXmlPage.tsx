import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { jsonToXmlTags } from '@/services/Tags';
import { JsonToXmlContent } from './JsonToolsContent';

const JsonToXmlPage = () => {
  return (
    <Sidebar title="JSON to XML">
      <JsonToXmlContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonToXmlTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonToXmlPage;
