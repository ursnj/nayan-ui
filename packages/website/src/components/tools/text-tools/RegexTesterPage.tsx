import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { regexTesterTags } from '@/services/Tags';
import { RegexTesterContent } from './TextToolsContent';

const RegexTesterPage = () => {
  return (
    <Sidebar title="Regex Tester">
      <RegexTesterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={regexTesterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default RegexTesterPage;
