import PdfMetadataEditorPage from "@/components/tools/pdf-tools/PdfMetadataEditorPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "PDF Metadata Editor",
  description:
    "View and edit a PDF's title, author, subject, and keywords, then download the updated file. Free online PDF metadata editor by Nayan UI.",
  path: "/tools/pdf-metadata-editor",
  keywords:
    "pdf metadata editor, edit pdf properties, change pdf title, change pdf author, pdf document properties, edit pdf metadata online, free pdf metadata editor, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "PDF Metadata Editor", url: `${SITE_URL}/tools/pdf-metadata-editor` },
  ]),
  buildTechArticleSchema({
    title: "PDF Metadata Editor",
    description: "View and edit a PDF's title, author, subject, and keywords, then download the updated file.",
    url: `${SITE_URL}/tools/pdf-metadata-editor`,
    keywords: "pdf metadata editor, edit pdf properties, pdf document properties",
  }),
];

export default function PdfMetadataEditorRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <PdfMetadataEditorPage />
    </>
  );
}
