import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { findAndReplaceTags } from '@/services/Tags';
import { FindAndReplaceContent } from './TextToolsContent';

const FindAndReplacePage = () => {
  return (
    <Sidebar title="Find & Replace">
      <FindAndReplaceContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={findAndReplaceTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default FindAndReplacePage;
