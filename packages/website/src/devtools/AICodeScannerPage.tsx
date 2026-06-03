'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/helpers/Sidebar';
import SubHeader from '@/helpers/SubHeader';
import TagsList from '@/helpers/TagsList';
import { aiScannerTags } from '@/services/Tags';
import { getMenuItem } from '@/services/Utils';
import AICodeScanner from './AICodeScanner';

const AICodeScannerPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || 'AI Code Scanner'}>
      <AICodeScanner />

      <SubHeader title="Tags">
        <TagsList type="devtools" tags={aiScannerTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default AICodeScannerPage;
