import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { watermarkPdfTags } from '@/services/Tags';
import { WatermarkPdfContent } from './PdfToolsContent';

const WatermarkPdfPage = () => {
  return (
    <Sidebar title="Watermark PDF">
      <WatermarkPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={watermarkPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default WatermarkPdfPage;
