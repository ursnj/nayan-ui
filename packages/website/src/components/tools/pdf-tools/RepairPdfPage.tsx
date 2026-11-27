import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { repairPdfTags } from '@/services/Tags';
import { RepairPdfContent } from './PdfToolsContent';

const RepairPdfPage = () => {
  return (
    <Sidebar title="Repair PDF">
      <RepairPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={repairPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default RepairPdfPage;
