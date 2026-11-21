import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { mergePdfTags } from '@/services/Tags';
import { MergePdfContent } from './PdfToolsContent';

const MergePdfPage = () => {
  return (
    <Sidebar title="Merge PDF">
      <MergePdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={mergePdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default MergePdfPage;
