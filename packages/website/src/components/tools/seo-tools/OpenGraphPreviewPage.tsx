import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { openGraphPreviewTags } from '@/services/Tags';
import { OpenGraphPreviewContent } from './SeoToolsContent';

const OpenGraphPreviewPage = () => {
  return (
    <Sidebar title="Open Graph Preview">
      <OpenGraphPreviewContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={openGraphPreviewTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default OpenGraphPreviewPage;
