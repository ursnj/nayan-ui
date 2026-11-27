import Link from 'next/link';
import { NText, NView } from 'nayan-ui/components';
import JsonLd from '@/components/helpers/JsonLd';
import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { DocsIntro } from '@/design/Primitives';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from '@/services/seo';
import { getMenuItem } from '@/services/Utils';

const path = '/tools/html-to-image';
const { title, description, tags } = getMenuItem(path)!;
const url = SITE_URL + path;

export const metadata = buildPageMetadata({ title, description, path });

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Developer Tools', url: `${SITE_URL}/tools` },
    { name: title, url }
  ]),
  buildTechArticleSchema({ title, description, url })
];

export default function HtmlToImagePage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Sidebar title={title}>
        <DocsIntro lead={description} />
        <SubHeader title="Capture a webpage in Chrome">
          <NView tag="ol" className="list-decimal space-y-2 pl-5 text-sm text-muted">
            <NView tag="li">Open the page you want to capture and wait for its images and fonts to load.</NView>
            <NView tag="li">Open DevTools, then press Ctrl+Shift+P on Windows or Linux, or Cmd+Shift+P on macOS, to open the Command Menu.</NView>
            <NView tag="li">
              Search for <NText tag="strong">Capture full size screenshot</NText> to save the entire page as a PNG. Use{' '}
              <NText tag="strong">Capture screenshot</NText> for the visible viewport.
            </NView>
          </NView>
          <Link href="https://developer.chrome.com/blog/devtools-tips-33" className="mt-3 inline-block text-sm text-accent hover:underline">
            Chrome DevTools screenshot guide
          </Link>
        </SubHeader>
        <SubHeader title="Choose PNG or JPEG">
          <NText tag="p" className="text-sm text-muted">
            Keep the PNG for interfaces, code examples, and small text. For a photo-heavy screenshot, open the PNG in an image editor and export
            it as JPEG. Compare the file size and readability at the intended display size.
          </NText>
          <Link href="/tools/convert-image" className="mt-3 inline-block text-sm text-accent hover:underline">
            Image format guide
          </Link>
        </SubHeader>
        {tags?.length && (
          <SubHeader title="Tags">
            <TagsList type="tools" tags={tags} />
          </SubHeader>
        )}
      </Sidebar>
    </>
  );
}
