import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { letterFrequencyAnalyzerTags } from '@/services/Tags';
import { LetterFrequencyAnalyzerContent } from './TextToolsContent';

const LetterFrequencyAnalyzerPage = () => {
  return (
    <Sidebar title="Letter Frequency Analyzer">
      <LetterFrequencyAnalyzerContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={letterFrequencyAnalyzerTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default LetterFrequencyAnalyzerPage;
