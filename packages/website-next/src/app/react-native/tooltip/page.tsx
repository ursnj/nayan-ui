import JsonLd from '@/helpers/JsonLd';
import RNTooltip from '@/react-native/components/Tooltip';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react-native/tooltip', 'react-native');
export const metadata = pageMetadata;

export default function RNTooltipPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNTooltip />
    </>
  );
}
