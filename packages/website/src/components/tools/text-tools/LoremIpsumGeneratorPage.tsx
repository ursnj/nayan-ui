import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { loremIpsumGeneratorTags } from '@/services/Tags';
import { LoremIpsumGeneratorContent } from './TextToolsContent';

const LoremIpsumGeneratorPage = () => {
  return (
    <Sidebar title="Lorem Ipsum Generator">
      <LoremIpsumGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={loremIpsumGeneratorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default LoremIpsumGeneratorPage;
