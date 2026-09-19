"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { DocsIntro } from "@/design/Primitives";
import { CARD, H4_CARD } from "@/design/system";
import Sidebar from "@/helpers/Sidebar";
import SubHeader from "@/helpers/SubHeader";
import TagsList from "@/helpers/TagsList";
import { reactNativeSidebarItems, reactSidebarItems } from "@/services/Utils";

const PLATFORMS = [
  {
    key: "react" as const,
    title: "React components",
    description: "For the web. Each tag links to the components that share it.",
    items: reactSidebarItems.filter((item: any) => item.isComponent),
  },
  {
    key: "react-native" as const,
    title: "React Native components",
    description: "For iOS and Android, tagged the same way.",
    items: reactNativeSidebarItems.filter((item: any) => item.isComponent),
  },
];

const Tags = () => (
  <Sidebar title="Component Tags">
    <DocsIntro
      lead="Tags group components by the problem they solve rather than by their name, so a tag is a good way in when you know the job but not the component. Every tag below links to the full list of components carrying it."
      facts={[
        { value: String(PLATFORMS[0].items.length), label: "React components" },
        { value: String(PLATFORMS[1].items.length), label: "React Native components" },
      ]}
    />

    {PLATFORMS.map((platform) => (
      <SubHeader key={platform.key} title={platform.title} description={platform.description}>
        <ul className="space-y-3">
          {platform.items.map((component: any) => (
            <li key={`${platform.key}-${component.title}`} className={`${CARD} p-4`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className={H4_CARD}>{component.title}</h3>
                <Link
                  href={component.link}
                  className="group inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  Docs
                  <ArrowRight
                    aria-hidden
                    className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
              <TagsList type={platform.key} tags={component.tags || []} />
            </li>
          ))}
        </ul>
      </SubHeader>
    ))}
  </Sidebar>
);

export default Tags;
