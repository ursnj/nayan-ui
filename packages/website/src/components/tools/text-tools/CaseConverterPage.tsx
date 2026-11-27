import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { caseConverterTags } from '@/services/Tags';
import { CaseConverterContent } from './TextToolsContent';

const CaseConverterPage = () => {
  return (
    <Sidebar title="Case Converter">
      <CaseConverterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={caseConverterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default CaseConverterPage;
