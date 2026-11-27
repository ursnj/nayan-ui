import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { csvToXmlTags } from '@/services/Tags';
import { CsvToXmlContent } from './XmlToolsContent';

const CsvToXmlPage = () => {
  return (
    <Sidebar title="CSV to XML">
      <CsvToXmlContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={csvToXmlTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default CsvToXmlPage;
