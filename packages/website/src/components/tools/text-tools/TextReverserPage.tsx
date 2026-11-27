import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { textReverserTags } from '@/services/Tags';
import { TextReverserContent } from './TextToolsContent';

const TextReverserPage = () => {
  return (
    <Sidebar title="Text Reverser">
      <TextReverserContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={textReverserTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default TextReverserPage;
