import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { excelToPdfTags } from '@/services/Tags';
import { ExcelToPdfContent } from './PdfToolsContent';

const ExcelToPdfPage = () => {
  return (
    <Sidebar title="Excel to PDF">
      <ExcelToPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={excelToPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default ExcelToPdfPage;
