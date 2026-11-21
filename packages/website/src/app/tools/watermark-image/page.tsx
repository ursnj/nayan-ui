import WatermarkImagePage from '@/components/tools/image-tools/WatermarkImagePage';
import JsonLd from '@/components/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from '@/services/seo';

export const metadata = buildPageMetadata({
  title: 'Watermark Image',
  description: 'Learn how to add text or logo watermarks using placement, typography, and opacity.',
  path: '/tools/watermark-image',
  keywords:
    'watermark image, add watermark, text watermark, logo watermark, photo watermark, image branding, overlay text on image, stamp image, copyright watermark, batch watermark, free watermark tool, nayan ui tools'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Developer Tools', url: `${SITE_URL}/tools` },
    { name: 'Watermark Image', url: `${SITE_URL}/tools/watermark-image` }
  ]),
  buildTechArticleSchema({
    title: 'Watermark Image',
    description: 'Learn how to add text or logo watermarks using placement, typography, and opacity.',
    url: `${SITE_URL}/tools/watermark-image`,
    keywords: 'watermark image, add watermark, text watermark, logo watermark, photo branding'
  })
];

export default function WatermarkImageRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <WatermarkImagePage />
    </>
  );
}
