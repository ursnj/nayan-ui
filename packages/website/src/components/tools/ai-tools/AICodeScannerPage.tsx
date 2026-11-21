import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { aiScannerTags } from '@/services/Tags';
import AICodeScanner from './AICodeScanner';

const AICodeScannerPage = () => {
  return (
    <Sidebar title="AI Code Scanner">
      <AICodeScanner />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={aiScannerTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default AICodeScannerPage;
