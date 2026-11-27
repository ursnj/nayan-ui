import XPathTesterPage from '@/components/tools/xml-tools/XPathTesterPage';
import JsonLd from '@/components/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from '@/services/seo';

export const metadata = buildPageMetadata({
  title: 'XPath Tester',
  description: 'Learn how to test XPath expressions and interpret their results.',
  path: '/tools/xpath-tester',
  keywords:
    'xpath tester, xpath evaluator, test xpath online, xpath query tool, xpath expression tester, xml xpath, xpath checker, free xpath tester, nayan ui tools'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Developer Tools', url: `${SITE_URL}/tools` },
    { name: 'XPath Tester', url: `${SITE_URL}/tools/xpath-tester` }
  ]),
  buildTechArticleSchema({
    title: 'XPath Tester',
    description: 'Learn how to test XPath expressions and interpret their results.',
    url: `${SITE_URL}/tools/xpath-tester`,
    keywords: 'xpath tester, xpath evaluator, xpath query tool, xml xpath'
  })
];

export default function XPathTesterRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <XPathTesterPage />
    </>
  );
}
