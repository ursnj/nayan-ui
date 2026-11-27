import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { robotsTags } from '@/services/Tags';
import { RobotsGeneratorContent } from './SeoToolsContent';

const RobotsPage = () => {
  return (
    <Sidebar title="Robots.txt Generator">
      <RobotsGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={robotsTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default RobotsPage;
