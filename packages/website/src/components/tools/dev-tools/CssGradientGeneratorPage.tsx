import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { cssGradientGeneratorTags } from '@/services/Tags';
import { CssGradientGeneratorContent } from './DevToolsContent';

const CssGradientGeneratorPage = () => {
  return (
    <Sidebar title="CSS Gradient Generator">
      <CssGradientGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={cssGradientGeneratorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default CssGradientGeneratorPage;
