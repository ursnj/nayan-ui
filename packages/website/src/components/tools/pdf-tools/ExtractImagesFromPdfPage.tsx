import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { extractImagesFromPdfTags } from '@/services/Tags';
import { ExtractImagesFromPdfContent } from './PdfToolsContent';

const ExtractImagesFromPdfPage = () => {
  return (
    <Sidebar title="Extract Images from PDF">
      <ExtractImagesFromPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={extractImagesFromPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default ExtractImagesFromPdfPage;
