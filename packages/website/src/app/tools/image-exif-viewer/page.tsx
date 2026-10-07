import ImageExifViewerPage from "@/components/tools/image-tools/ImageExifViewerPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Image EXIF Viewer",
  description:
    "View EXIF metadata embedded in JPEG photos — camera make and model, exposure settings, and GPS location — entirely in your browser. Free online EXIF viewer by Nayan UI.",
  path: "/tools/image-exif-viewer",
  keywords:
    "image exif viewer, exif data viewer, view photo metadata, jpeg metadata reader, camera exif reader, gps exif data, exposure data viewer, free exif viewer, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Image EXIF Viewer", url: `${SITE_URL}/tools/image-exif-viewer` },
  ]),
  buildTechArticleSchema({
    title: "Image EXIF Viewer",
    description: "View EXIF metadata embedded in JPEG photos entirely in your browser.",
    url: `${SITE_URL}/tools/image-exif-viewer`,
    keywords: "exif viewer, photo metadata, camera data, gps coordinates",
  }),
];

export default function ImageExifViewerRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <ImageExifViewerPage />
    </>
  );
}
