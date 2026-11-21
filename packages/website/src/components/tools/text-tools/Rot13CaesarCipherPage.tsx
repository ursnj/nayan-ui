import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { rot13CaesarCipherTags } from '@/services/Tags';
import { Rot13CaesarCipherContent } from './TextToolsContent';

const Rot13CaesarCipherPage = () => {
  return (
    <Sidebar title="ROT13 / Caesar Cipher">
      <Rot13CaesarCipherContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={rot13CaesarCipherTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default Rot13CaesarCipherPage;
