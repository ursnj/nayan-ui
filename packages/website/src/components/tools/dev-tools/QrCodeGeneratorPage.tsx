import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { qrCodeGeneratorTags } from '@/services/Tags';
import { QrCodeGeneratorContent } from './DevToolsContent';

const QrCodeGeneratorPage = () => {
  return (
    <Sidebar title="QR Code Generator">
      <QrCodeGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={qrCodeGeneratorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default QrCodeGeneratorPage;
