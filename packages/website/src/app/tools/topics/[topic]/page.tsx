import { NText, NView } from 'nayan-ui/components';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/helpers/JsonLd';
import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import { DocsIntro } from '@/design/Primitives';
import { CARD_INTERACTIVE, H4_CARD } from '@/design/system';
import { SITE_URL, buildBreadcrumbSchema, buildCollectionSchema, buildPageMetadata } from '@/services/seo';
import { findToolTopic, toolTopics } from '@/services/tool-topics';

export const dynamicParams = false;

type Props = { params: Promise<{ topic: string }> };

export function generateStaticParams() {
  return toolTopics.map(({ id }) => ({ topic: id }));
}

async function getTopic({ params }: Props) {
  return findToolTopic((await params).topic) ?? notFound();
}

export async function generateMetadata(props: Props) {
  const { title, description, path } = await getTopic(props);
  return buildPageMetadata({ title: `${title} and Guides`, description, path, bannerFor: '/tools', ogType: 'website' });
}

export default async function ToolTopicPage(props: Props) {
  const { title, description, path, tools, workflow } = await getTopic(props);
  const entries = tools.map(({ title, link }) => ({ title, path: link }));
  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema([
            { name: 'Home', url: SITE_URL },
            { name: 'Tools', url: `${SITE_URL}/tools` },
            { name: title, url: SITE_URL + path }
          ]),
          buildCollectionSchema({ title, description, path, entries })
        ]}
      />
      <Sidebar title={title}>
        <DocsIntro lead={description} />
        <SubHeader title="Where to start">
          <NView tag="ol" className="grid list-decimal gap-2 pl-5 text-muted">
            {workflow.map(({ slug, text }) => {
              const tool = tools.find(({ link }) => link === `/tools/${slug}`);
              return (
                tool && (
                  <NText tag="li" key={slug}>
                    <Link href={tool.link} className="font-medium text-accent hover:underline">
                      {tool.title}
                    </Link>
                    {'. '}
                    {text}
                  </NText>
                )
              );
            })}
          </NView>
        </SubHeader>
        <SubHeader title="All guides">
          <NView tag="ul" className="grid gap-3 sm:grid-cols-2">
            {tools.map(({ title, link, description }) => (
              <NView key={link} tag="li">
                <Link href={link} className={`${CARD_INTERACTIVE} block h-full p-4`}>
                  <NText tag="h3" className={H4_CARD}>
                    {title}
                  </NText>
                  <NText tag="p" className="mt-1 text-sm text-muted">
                    {description}
                  </NText>
                </Link>
              </NView>
            ))}
          </NView>
        </SubHeader>
      </Sidebar>
    </>
  );
}
