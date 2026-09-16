import JsonLd from '@/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from '@/services/seo';
import VideoEditor from '@/videoEditor/VideoEditor';
import { FAQS } from '@/videoEditor/content';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'Nayan UI Video Editor — Free Online Video Editor, No Upload',
  description:
    'Edit video free in your browser. Multi-track timeline, 16 colour filters, 18 transitions, keyframes, green screen and titles. Exports MP4, MOV, MKV, WebM. Nothing is uploaded — no account, no watermark.',
  path: '/video-editor',
  keywords:
    'free online video editor, browser video editor, video editor no upload, video editor no watermark, webcodecs video editor, offline video editor, multi track timeline, green screen online, chroma key browser, keyframe animation, video filters online, video transitions, mp4 export, vertical video editor, privacy video editor, nayan ui video editor, nayan editor',
  ogType: 'website'
});

/*
 * The running editor is a static bundle served from /video-editor/start, a
 * subpath of this page rather than a route of its own: a static folder cannot
 * shadow a Next route, so the app has to live one level below the page that
 * describes it. next.config rewrites the extensionless URL onto the bundle's
 * index.html, and redirects the old /editor to it.
 */
const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Video Editor', url: `${SITE_URL}/video-editor` }
  ]),
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Nayan UI Video Editor',
    // The name it shipped under, kept so links and searches for it still land here.
    alternateName: 'Nayan Editor',
    applicationCategory: 'MultimediaApplication',
    applicationSubCategory: 'Video Editor',
    operatingSystem: 'Web Browser',
    description:
      'A free, full-featured video editor that runs entirely in the browser. Multi-track timeline, keyframe animation, green screen, 16 colour filters, 18 transitions, titles and MP4 export using WebCodecs. No upload, no account, no watermark.',
    url: `${SITE_URL}/video-editor`,
    installUrl: `${SITE_URL}/video-editor/start`,
    browserRequirements: 'Requires WebCodecs and a window at least 1024px wide. Chrome/Edge 94+, Safari 16.4+.',
    softwareVersion: '1.0',
    isAccessibleForFree: true,
    license: 'https://opensource.org/licenses/MIT',
    author: { '@type': 'Organization', name: 'Nayan UI', url: SITE_URL },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
    featureList: [
      'Multi-track video and audio timeline',
      'Keyframe animation',
      'Green screen / chroma key',
      '16 colour filters with adjustable strength',
      '18 transitions',
      'Titles with entrance animations',
      'Gradient, image and blurred-clip backgrounds',
      'Export to MP4, MOV, MKV, WebM, M4A, WAV and OGG',
      'Projects save to one file with the media inside',
      'Runs fully offline in the browser — nothing is uploaded'
    ]
  },
  /*
   * Built from the same array the page renders, so the two can never drift.
   * A FAQPage that disagrees with the visible copy is a structured-data
   * violation, and answering only half the questions wastes the rest.
   */
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a }
    }))
  }
];

export default function VideoEditorPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <VideoEditor />
    </>
  );
}
