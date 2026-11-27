import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { textToBinaryTags } from '@/services/Tags';
import { TextToBinaryContent } from './TextToolsContent';

const TextToBinaryPage = () => {
  return (
    <Sidebar title="Text to Binary">
      <TextToBinaryContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={textToBinaryTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default TextToBinaryPage;
