import CronExpressionParserPage from '@/components/tools/dev-tools/CronExpressionParserPage';
import JsonLd from '@/components/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from '@/services/seo';

export const metadata = buildPageMetadata({
  title: 'Cron Expression Parser',
  description: 'Learn how to read cron fields and verify a schedule against expected run times.',
  path: '/tools/cron-expression-parser',
  keywords:
    'cron expression parser, cron job parser, crontab generator, cron validator, cron syntax checker, next run time, cron schedule, free cron tool, nayan ui tools'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Developer Tools', url: `${SITE_URL}/tools` },
    { name: 'Cron Expression Parser', url: `${SITE_URL}/tools/cron-expression-parser` }
  ]),
  buildTechArticleSchema({
    title: 'Cron Expression Parser',
    description: 'Learn how to read cron fields and verify a schedule against expected run times.',
    url: `${SITE_URL}/tools/cron-expression-parser`,
    keywords: 'cron expression parser, crontab, cron validator, cron schedule'
  })
];

export default function CronExpressionParserRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <CronExpressionParserPage />
    </>
  );
}
