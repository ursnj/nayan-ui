import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { cronExpressionParserTags } from '@/services/Tags';
import { CronExpressionParserContent } from './DevToolsContent';

const CronExpressionParserPage = () => {
  return (
    <Sidebar title="Cron Expression Parser">
      <CronExpressionParserContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={cronExpressionParserTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default CronExpressionParserPage;
