import CropImagePage from '@/components/tools/image-tools/CropImagePage';
import JsonLd from '@/components/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from '@/services/seo';

export const metadata = buildPageMetadata({
  title: 'Crop Image',
  description: 'Learn how to crop images using pixel coordinates and aspect ratios.',
  path: '/tools/crop-image',
  keywords:
    'crop image, image cropper, crop photo, crop jpg, crop png, visual cropper, trim image, cut image, image cutter, crop picture online, free image cropper, custom crop tool, nayan ui tools'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Developer Tools', url: `${SITE_URL}/tools` },
    { name: 'Crop Image', url: `${SITE_URL}/tools/crop-image` }
  ]),
  buildTechArticleSchema({
    title: 'Crop Image',
    description: 'Learn how to crop images using pixel coordinates and aspect ratios.',
    url: `${SITE_URL}/tools/crop-image`,
    keywords: 'crop image, image cropper, crop photo, visual cropper, trim image'
  })
];

export default function CropImageRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <CropImagePage />
    </>
  );
}
