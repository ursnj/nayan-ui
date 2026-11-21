import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { aiReviewTags } from '@/services/Tags';
import AICodeReviewer from './AICodeReviewer';

const AICodeReviewerPage = () => {
  return (
    <Sidebar title="AI Code Reviewer">
      <AICodeReviewer />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={aiReviewTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default AICodeReviewerPage;
