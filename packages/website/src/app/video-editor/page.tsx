import JsonLd from '@/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from '@/services/seo';
import VideoEditor from '@/videoEditor/VideoEditor';
import { FAQS, GLOSSARY, WORKFLOW_STEPS } from '@/videoEditor/content';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'Free Online Video Editor — No Upload, No Watermark',
  description:
    'Edit video free in your browser. Multi-track timeline, green screen, 15 colour looks, 18 transitions, titles and captions. Exports MP4, MOV, MKV and WebM up to 4K. Nothing is uploaded — no account, no watermark.',
  path: '/video-editor',
  keywords:
    'free online video editor, browser video editor, video editor no upload, video editor no watermark, video editor no sign up, webcodecs video editor, offline video editor, multi track timeline editor, green screen online, chroma key browser, video filters online, video transitions online, mp4 export, 4k video editor browser, vertical video editor, reels editor, shorts editor, tiktok video editor, privacy video editor, open source video editor, nayan ui video editor, nayan editor',
  ogType: 'website'
});

/*
 * The running editor is a static bundle served from /video-editor/start, a
 * subpath of this page rather than a route of its own: a static folder cannot
 * shadow a Next route, so the app has to live one level below the page that
 * describes it. next.config rewrites the extensionless URL onto the bundle's
 * index.html, and redirects the old /editor to it.
 */
const PAGE_URL = `${SITE_URL}/video-editor`;

/*
 * Structured data, all of it built from the arrays the page renders so the two
 * can never drift. A FAQPage or HowTo that disagrees with the visible copy is
 * a structured-data violation, and answering only half the questions wastes
 * the rest.
 *
 * No `aggregateRating`, deliberately: there are no reviews to aggregate, and
 * inventing them is the one thing in this file that would be worth a penalty.
 */
const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Video Editor', url: PAGE_URL }
  ]),
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Nayan UI Video Editor',
    // The name it shipped under, kept so links and searches for it still land here.
    alternateName: ['Nayan Editor', 'Nayan UI Free Online Video Editor'],
    applicationCategory: 'MultimediaApplication',
    applicationSubCategory: 'Video Editor',
    operatingSystem: 'Web Browser',
    browserRequirements: 'Requires WebCodecs and a window at least 1024px wide. Chrome/Edge 94+, Safari 16.4+.',
    description:
      'A free, full-featured video editor that runs entirely in the browser. Multi-track timeline, green screen, 15 colour looks, 18 transitions, titles and MP4 export up to 4K using WebCodecs. No upload, no account, no watermark.',
    url: PAGE_URL,
    installUrl: `${SITE_URL}/video-editor/start`,
    softwareVersion: '1.0',
    datePublished: '2025-09-01',
    dateModified: new Date().toISOString().split('T')[0],
    isAccessibleForFree: true,
    license: 'https://opensource.org/licenses/MIT',
    permissions: 'None. No network access, no account and no file upload.',
    author: { '@type': 'Organization', name: 'Nayan UI', url: SITE_URL },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
    featureList: [
      'Multi-track video and audio timeline',
      'Trim, split, ripple delete, grouping and multi-select',
      'Frame-accurate playhead with snapping and in/out marking',
      'Green screen / chroma key with spill removal',
      '15 colour looks with an adjustable strength, plus a full manual grade',
      '18 transitions',
      'Titles and captions with five entrance animations',
      'Gradient, image and blurred-clip backgrounds',
      'Per-clip volume, fades, speed and reverse, plus track faders',
      'Projects up to 4K 3840x2160 at 23.976-60 fps',
      'Export to MP4, MOV, MKV, WebM, M4A, WAV and OGG',
      'Projects save to one file with the media inside',
      'Runs fully offline in the browser — nothing is uploaded'
    ]
  },
  {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to edit a video in your browser',
    description:
      'Six steps from a folder of clips to a finished file using the Nayan UI Video Editor — no account, no upload and no software to install.',
    totalTime: 'PT15M',
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: '0' },
    tool: [{ '@type': 'HowToTool', name: 'A browser with WebCodecs support' }],
    step: WORKFLOW_STEPS.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title,
      text: step.body,
      url: `${PAGE_URL}#workflow`
    }))
  },
  {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Video editing terms',
    description: 'The vocabulary used by the Nayan UI Video Editor and by video editing generally.',
    url: `${PAGE_URL}#glossary`,
    hasDefinedTerm: GLOSSARY.map(entry => ({
      '@type': 'DefinedTerm',
      name: entry.term,
      description: entry.definition,
      inDefinedTermSet: `${PAGE_URL}#glossary`
    }))
  },
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
