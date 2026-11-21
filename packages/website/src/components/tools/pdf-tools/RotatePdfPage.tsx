import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { rotatePdfTags } from '@/services/Tags';
import { RotatePdfContent } from './PdfToolsContent';

const RotatePdfPage = () => {
  return (
    <Sidebar title="Rotate PDF">
      <RotatePdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={rotatePdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default RotatePdfPage;
