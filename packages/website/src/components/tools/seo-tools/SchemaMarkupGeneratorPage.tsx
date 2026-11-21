import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { schemaMarkupGeneratorTags } from '@/services/Tags';
import { SchemaMarkupGeneratorContent } from './SeoToolsContent';

const SchemaMarkupGeneratorPage = () => {
  return (
    <Sidebar title="Schema Markup Generator">
      <SchemaMarkupGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={schemaMarkupGeneratorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default SchemaMarkupGeneratorPage;
