import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { wordToPdfTags } from '@/services/Tags';
import { WordToPdfContent } from './PdfToolsContent';

const WordToPdfPage = () => {
  return (
    <Sidebar title="Word to PDF">
      <WordToPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={wordToPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default WordToPdfPage;
