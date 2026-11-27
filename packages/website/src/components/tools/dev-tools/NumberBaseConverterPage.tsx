import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { numberBaseConverterTags } from '@/services/Tags';
import { NumberBaseConverterContent } from './DevToolsContent';

const NumberBaseConverterPage = () => {
  return (
    <Sidebar title="Number Base Converter">
      <NumberBaseConverterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={numberBaseConverterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default NumberBaseConverterPage;
