import JsonLd from '@/helpers/JsonLd';
import Popover from '@/react/components/Popover';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/popover', 'react');
export const metadata = pageMetadata;

export default function PopoverPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Popover />
    </>
  );
}
