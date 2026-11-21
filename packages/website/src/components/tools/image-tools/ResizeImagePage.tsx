import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { resizeImageTags } from '@/services/Tags';
import { ResizeImageContent } from './ImageToolsContent';

const ResizeImagePage = () => {
  return (
    <Sidebar title="Resize Image">
      <ResizeImageContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={resizeImageTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default ResizeImagePage;
