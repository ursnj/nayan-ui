import RegexTesterPage from '@/components/tools/text-tools/RegexTesterPage';
import JsonLd from '@/components/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from '@/services/seo';

export const metadata = buildPageMetadata({
  title: 'Regex Tester',
  description: 'Learn how to test regular expressions against representative input and edge cases.',
  path: '/tools/regex-tester',
  keywords:
    'regex tester, regex validator, regular expression tester, online regex tool, regex pattern matcher, regex debugger, free regex tester, nayan ui tools'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Developer Tools', url: `${SITE_URL}/tools` },
    { name: 'Regex Tester', url: `${SITE_URL}/tools/regex-tester` }
  ]),
  buildTechArticleSchema({
    title: 'Regex Tester',
    description: 'Learn how to test regular expressions against representative input and edge cases.',
    url: `${SITE_URL}/tools/regex-tester`,
    keywords: 'regex tester, regular expression, pattern matcher, regex debugger'
  })
];

export default function RegexTesterRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <RegexTesterPage />
    </>
  );
}
