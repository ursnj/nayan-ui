import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { watermarkImageTags } from '@/services/Tags';
import { WatermarkImageContent } from './ImageToolsContent';

const WatermarkImagePage = () => {
  return (
    <Sidebar title="Watermark Image">
      <WatermarkImageContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={watermarkImageTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default WatermarkImagePage;
