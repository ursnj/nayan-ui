import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { pdfMetadataEditorTags } from '@/services/Tags';
import { PdfMetadataEditorContent } from './PdfToolsContent';

const PdfMetadataEditorPage = () => {
  return (
    <Sidebar title="PDF Metadata Editor">
      <PdfMetadataEditorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={pdfMetadataEditorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default PdfMetadataEditorPage;
