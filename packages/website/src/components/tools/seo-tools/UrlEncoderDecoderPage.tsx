import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { urlEncoderDecoderTags } from '@/services/Tags';
import { UrlEncoderDecoderContent } from './SeoToolsContent';

const UrlEncoderDecoderPage = () => {
  return (
    <Sidebar title="URL Encoder/Decoder">
      <UrlEncoderDecoderContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={urlEncoderDecoderTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default UrlEncoderDecoderPage;
