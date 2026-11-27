import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { xpathTesterTags } from '@/services/Tags';
import { XPathTesterContent } from './XmlToolsContent';

const XPathTesterPage = () => {
  return (
    <Sidebar title="XPath Tester">
      <XPathTesterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={xpathTesterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default XPathTesterPage;
