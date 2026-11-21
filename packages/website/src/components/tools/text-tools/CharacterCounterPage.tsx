import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { characterCounterTags } from '@/services/Tags';
import { CharacterCounterContent } from './TextToolsContent';

const CharacterCounterPage = () => {
  return (
    <Sidebar title="Character Counter">
      <CharacterCounterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={characterCounterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default CharacterCounterPage;
