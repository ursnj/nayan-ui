import JsonLd from '@/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from '@/services/seo';
import VideoEditor from '@/videoEditor/VideoEditor';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'Nayan Editor - Free Browser Video Editor',
  description:
    'A free, full-featured video editor that runs entirely in your browser. Multi-track timeline, keyframe animation, green screen, titles and transitions — powered by WebCodecs. No upload, no account, no watermark.',
  path: '/video-editor',
  keywords:
    'browser video editor, online video editor, free video editor, webcodecs video editor, no upload video editor, multi track timeline, green screen, chroma key, keyframe animation, mp4 export, nayan editor'
});

/*
 * The running editor is a static bundle served from /editor, which is a
 * different URL to this page on purpose — a Next route at /editor would
 * shadow the bundle and the app would become unreachable.
 */
const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Video Editor', url: `${SITE_URL}/video-editor` }
  ]),
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Nayan Editor',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web Browser',
    description:
      'A free, full-featured video editor that runs entirely in the browser. Multi-track timeline, keyframe animation, green screen, titles, transitions and MP4 export using WebCodecs.',
    url: `${SITE_URL}/video-editor`,
    installUrl: `${SITE_URL}/editor`,
    browserRequirements: 'Requires WebCodecs. Chrome/Edge 94+, Safari 16.4+.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: [
      'Multi-track video and audio timeline',
      'Keyframe animation',
      'Green screen / chroma key',
      'Colour grading with presets',
      'Titles with entrance animations',
      'Transitions',
      'MP4 and WebM export',
      'Runs fully offline in the browser'
    ]
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Are my files uploaded anywhere?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. There is no server, no account and no upload step. Your media is opened directly from disk, decoded in the browser, and the finished file is written back to your downloads folder.'
        }
      },
      {
        '@type': 'Question',
        name: 'Which browsers support Nayan Editor?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Any browser with WebCodecs: Chrome and Edge 94 or newer, and Safari 16.4 or newer.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is there a watermark or a length limit?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Neither. The only practical limits are your machine memory and how long you are willing to wait for the encode.'
        }
      }
    ]
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
