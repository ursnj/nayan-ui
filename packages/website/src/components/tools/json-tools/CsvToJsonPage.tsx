import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { csvToJsonTags } from '@/services/Tags';
import { CsvToJsonContent } from './JsonToolsContent';

const CsvToJsonPage = () => {
  return (
    <Sidebar title="CSV to JSON">
      <CsvToJsonContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={csvToJsonTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default CsvToJsonPage;
