import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { robotsValidatorTags } from '@/services/Tags';
import { RobotsValidatorContent } from './SeoToolsContent';

const RobotsValidatorPage = () => {
  return (
    <Sidebar title="Robots.txt Validator">
      <RobotsValidatorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={robotsValidatorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default RobotsValidatorPage;
