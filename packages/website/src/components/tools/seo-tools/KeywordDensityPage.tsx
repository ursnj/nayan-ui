import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { keywordDensityTags } from '@/services/Tags';
import { KeywordDensityContent } from './SeoToolsContent';

const KeywordDensityPage = () => {
  return (
    <Sidebar title="Keyword Density Analyzer">
      <KeywordDensityContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={keywordDensityTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default KeywordDensityPage;
