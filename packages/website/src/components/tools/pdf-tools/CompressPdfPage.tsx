import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { compressPdfTags } from '@/services/Tags';
import { CompressPdfContent } from './PdfToolsContent';

const CompressPdfPage = () => {
  return (
    <Sidebar title="Compress PDF">
      <CompressPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={compressPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default CompressPdfPage;
