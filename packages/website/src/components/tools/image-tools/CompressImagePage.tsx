import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { compressImageTags } from '@/services/Tags';
import { CompressImageContent } from './ImageToolsContent';

const CompressImagePage = () => {
  return (
    <Sidebar title="Compress Image">
      <CompressImageContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={compressImageTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default CompressImagePage;
