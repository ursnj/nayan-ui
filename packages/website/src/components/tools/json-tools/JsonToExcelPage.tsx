import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { jsonToExcelTags } from '@/services/Tags';
import { JsonToExcelContent } from './JsonToolsContent';

const JsonToExcelPage = () => {
  return (
    <Sidebar title="JSON to Excel">
      <JsonToExcelContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonToExcelTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonToExcelPage;
