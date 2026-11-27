import CssGradientGeneratorPage from '@/components/tools/dev-tools/CssGradientGeneratorPage';
import JsonLd from '@/components/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from '@/services/seo';

export const metadata = buildPageMetadata({
  title: 'CSS Gradient Generator',
  description: 'Learn how to design CSS gradients with colour stops, angles, and positions.',
  path: '/tools/css-gradient-generator',
  keywords:
    'css gradient generator, linear gradient generator, radial gradient generator, css background gradient, gradient maker, gradient color picker, free css gradient tool, nayan ui tools'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Developer Tools', url: `${SITE_URL}/tools` },
    { name: 'CSS Gradient Generator', url: `${SITE_URL}/tools/css-gradient-generator` }
  ]),
  buildTechArticleSchema({
    title: 'CSS Gradient Generator',
    description: 'Learn how to design CSS gradients with colour stops, angles, and positions.',
    url: `${SITE_URL}/tools/css-gradient-generator`,
    keywords: 'css gradient generator, linear gradient, radial gradient, css background'
  })
];

export default function CssGradientGeneratorRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <CssGradientGeneratorPage />
    </>
  );
}
