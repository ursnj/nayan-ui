import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { morseCodeConverterTags } from '@/services/Tags';
import { MorseCodeConverterContent } from './TextToolsContent';

const MorseCodeConverterPage = () => {
  return (
    <Sidebar title="Morse Code Converter">
      <MorseCodeConverterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={morseCodeConverterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default MorseCodeConverterPage;
