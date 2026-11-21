import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { htmlEntityEncoderDecoderTags } from '@/services/Tags';
import { HtmlEntityEncoderDecoderContent } from './DevToolsContent';

const HtmlEntityEncoderDecoderPage = () => {
  return (
    <Sidebar title="HTML Entity Encoder/Decoder">
      <HtmlEntityEncoderDecoderContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={htmlEntityEncoderDecoderTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default HtmlEntityEncoderDecoderPage;
