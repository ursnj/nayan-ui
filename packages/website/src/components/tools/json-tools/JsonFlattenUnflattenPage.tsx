import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { jsonFlattenUnflattenTags } from '@/services/Tags';
import { JsonFlattenUnflattenContent } from './JsonToolsContent';

const JsonFlattenUnflattenPage = () => {
  return (
    <Sidebar title="JSON Flatten/Unflatten">
      <JsonFlattenUnflattenContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonFlattenUnflattenTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonFlattenUnflattenPage;
