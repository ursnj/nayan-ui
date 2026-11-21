import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { convertImageTags } from '@/services/Tags';
import { ConvertImageContent } from './ImageToolsContent';

const ConvertImagePage = () => {
  return (
    <Sidebar title="Convert Image">
      <ConvertImageContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={convertImageTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default ConvertImagePage;
