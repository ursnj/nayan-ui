import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { jsonQueryStringConverterTags } from '@/services/Tags';
import { JsonQueryStringConverterContent } from './JsonToolsContent';

const JsonQueryStringConverterPage = () => {
  return (
    <Sidebar title="JSON ⇄ Query String">
      <JsonQueryStringConverterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonQueryStringConverterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonQueryStringConverterPage;
