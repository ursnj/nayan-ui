'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/helpers/Sidebar';
import SubHeader from '@/helpers/SubHeader';
import TagsList from '@/helpers/TagsList';
import { aiReviewTags } from '@/services/Tags';
import { getMenuItem } from '@/services/Utils';
import AICodeReviewer from './AICodeReviewer';

const AICodeReviewerPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || 'AI Code Reviewer'}>
      <AICodeReviewer />

      <SubHeader title="Tags">
        <TagsList type="devtools" tags={aiReviewTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default AICodeReviewerPage;
