import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { faviconGeneratorTags } from '@/services/Tags';
import { FaviconGeneratorContent } from './ImageToolsContent';

const FaviconGeneratorPage = () => {
  return (
    <Sidebar title="Favicon Generator">
      <FaviconGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={faviconGeneratorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default FaviconGeneratorPage;
