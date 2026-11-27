import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { xmlToExcelTags } from '@/services/Tags';
import { XmlToExcelContent } from './XmlToolsContent';

const XmlToExcelPage = () => {
  return (
    <Sidebar title="XML to Excel">
      <XmlToExcelContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={xmlToExcelTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default XmlToExcelPage;
