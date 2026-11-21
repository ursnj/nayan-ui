import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { base64EncoderDecoderTags } from '@/services/Tags';
import { Base64EncoderDecoderContent } from './TextToolsContent';

const Base64EncoderDecoderPage = () => {
  return (
    <Sidebar title="Base64 Encoder/Decoder">
      <Base64EncoderDecoderContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={base64EncoderDecoderTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default Base64EncoderDecoderPage;
