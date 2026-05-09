import JsonLd from '@/helpers/JsonLd';
import Progress from '@/react/components/Progress';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/progress', 'react');
export const metadata = pageMetadata;

export default function ProgressPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Progress />
    </>
  );
}
