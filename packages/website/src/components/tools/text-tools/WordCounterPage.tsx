import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { wordCounterTags } from '@/services/Tags';
import { WordCounterContent } from './TextToolsContent';

const WordCounterPage = () => {
  return (
    <Sidebar title="Word Counter">
      <WordCounterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={wordCounterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default WordCounterPage;
