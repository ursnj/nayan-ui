import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { colorConverterTags } from '@/services/Tags';
import { ColorConverterContent } from './DevToolsContent';

const ColorConverterPage = () => {
  return (
    <Sidebar title="Color Converter">
      <ColorConverterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={colorConverterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default ColorConverterPage;
