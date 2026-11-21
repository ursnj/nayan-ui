import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { jwtDecoderTags } from '@/services/Tags';
import { JwtDecoderContent } from './DevToolsContent';

const JwtDecoderPage = () => {
  return (
    <Sidebar title="JWT Decoder">
      <JwtDecoderContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jwtDecoderTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JwtDecoderPage;
