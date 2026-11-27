import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { utmCampaignBuilderTags } from '@/services/Tags';
import { UtmCampaignBuilderContent } from './SeoToolsContent';

const UtmCampaignBuilderPage = () => {
  return (
    <Sidebar title="UTM Campaign URL Builder">
      <UtmCampaignBuilderContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={utmCampaignBuilderTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default UtmCampaignBuilderPage;
