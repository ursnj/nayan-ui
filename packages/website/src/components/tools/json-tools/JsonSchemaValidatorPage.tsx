import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { jsonSchemaValidatorTags } from '@/services/Tags';
import { JsonSchemaValidatorContent } from './JsonToolsContent';

const JsonSchemaValidatorPage = () => {
  return (
    <Sidebar title="JSON Schema Validator">
      <JsonSchemaValidatorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonSchemaValidatorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonSchemaValidatorPage;
