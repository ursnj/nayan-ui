import PdfToTextPage from '@/components/tools/pdf-tools/PdfToTextPage';
import JsonLd from '@/components/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from '@/services/seo';

export const metadata = buildPageMetadata({
  title: 'PDF to Text',
  description: 'Learn how to extract searchable text from PDFs and when OCR is needed.',
  path: '/tools/pdf-to-text',
  keywords:
    'pdf to text, extract text from pdf, pdf text extractor, convert pdf to text online, pdf to txt, free pdf text extractor, get text from pdf, pdf plain text, nayan ui tools'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Developer Tools', url: `${SITE_URL}/tools` },
    { name: 'PDF to Text', url: `${SITE_URL}/tools/pdf-to-text` }
  ]),
  buildTechArticleSchema({
    title: 'PDF to Text',
    description: 'Learn how to extract searchable text from PDFs and when OCR is needed.',
    url: `${SITE_URL}/tools/pdf-to-text`,
    keywords: 'pdf to text, extract text from pdf, pdf text extractor, pdf to txt'
  })
];

export default function PdfToTextRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <PdfToTextPage />
    </>
  );
}
