import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { textCompareTags } from '@/services/Tags';
import { TextCompareContent } from './TextToolsContent';

const TextComparePage = () => {
  return (
    <Sidebar title="Text Compare">
      <TextCompareContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={textCompareTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default TextComparePage;
