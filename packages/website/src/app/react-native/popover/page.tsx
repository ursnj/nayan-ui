import JsonLd from '@/helpers/JsonLd';
import RNPopover from '@/react-native/components/Popover';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react-native/popover', 'react-native');
export const metadata = pageMetadata;

export default function RNPopoverPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNPopover />
    </>
  );
}
