import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { jsonFormatterTags } from '@/services/Tags';
import { JsonFormatterContent } from './JsonToolsContent';

const JsonFormatterPage = () => {
  return (
    <Sidebar title="JSON Formatter">
      <JsonFormatterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonFormatterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonFormatterPage;
