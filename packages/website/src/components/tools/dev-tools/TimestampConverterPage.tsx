import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { timestampConverterTags } from '@/services/Tags';
import { TimestampConverterContent } from './DevToolsContent';

const TimestampConverterPage = () => {
  return (
    <Sidebar title="Timestamp Converter">
      <TimestampConverterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={timestampConverterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default TimestampConverterPage;
