import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { lineSorterTags } from '@/services/Tags';
import { LineSorterContent } from './TextToolsContent';

const LineSorterPage = () => {
  return (
    <Sidebar title="Line Sorter">
      <LineSorterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={lineSorterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default LineSorterPage;
