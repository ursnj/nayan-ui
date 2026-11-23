import Link from "next/link";
import { notFound } from "next/navigation";
import { NView } from "nayan-ui/components";
import JsonLd from "@/components/helpers/JsonLd";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import TagDetails from "@/components/tags/TagsDetails";
import { DocsIntro } from "@/design/Primitives";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from "@/services/seo";
import { getMenuItemByTag, getSidebarItems } from "@/services/Utils";

type Platform = "react" | "react-native";

const labels = { "react": "React", "react-native": "React Native" };

function getTag(platform: Platform, sku: string) {
  const component = getMenuItemByTag(sku, `/${platform}`);
  const tag = component?.tags?.find((item) => item.sku === sku);
  if (!component || !tag) notFound();
  return { component, tag };
}

function breadcrumbs(platform: Platform, tag?: { sku: string; text: string }) {
  return buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: labels[platform], url: `${SITE_URL}/${platform}/components` },
    { name: "Tags", url: `${SITE_URL}/${platform}/tags` },
    ...(tag ? [{ name: tag.text, url: `${SITE_URL}/${platform}/tags/${encodeURIComponent(tag.sku)}` }] : []),
  ]);
}

export function platformTagsMetadata(platform: Platform) {
  return buildPageMetadata({
    title: `${labels[platform]} Component Tags`,
    description: `Browse Nayan UI ${labels[platform]} components by functionality and use case.`,
    path: `/${platform}/tags`,
  });
}

export function platformTagMetadata(platform: Platform, sku: string) {
  const { tag, component } = getTag(platform, sku);
  return buildPageMetadata({
    title: `${tag.text} · ${labels[platform]} Component Tag`,
    description: `Browse Nayan UI ${labels[platform]} components tagged with “${tag.text}”.`,
    path: `/${platform}/tags/${encodeURIComponent(tag.sku)}`,
    bannerFor: component.link,
  });
}

export function PlatformTags({ platform }: { platform: Platform }) {
  const { title, description } = platformTagsMetadata(platform);
  return (
    <>
      <JsonLd data={breadcrumbs(platform)} />
      <Sidebar title={String(title)}>
        <DocsIntro lead={description ?? ""} />
        <NView tag="div" className="space-y-4">
          {getSidebarItems(`/${platform}`).map(({ link, title, tags }) =>
            tags?.length ? (
              <SubHeader
                key={link}
                title={title}
                action={<Link href={link} className="text-sm text-accent hover:underline">View component</Link>}
              >
                <TagsList type={platform} tags={tags} />
              </SubHeader>
            ) : null
          )}
        </NView>
      </Sidebar>
    </>
  );
}

export function PlatformTag({ platform, sku }: { platform: Platform; sku: string }) {
  const { tag } = getTag(platform, sku);
  return (
    <>
      <JsonLd data={breadcrumbs(platform, tag)} />
      <TagDetails tag={tag.sku} />
    </>
  );
}
