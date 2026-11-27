"use client";

import { NView, NText } from 'nayan-ui/components';
import { ArrowRight } from "@/design/Icons";
import Link from "next/link";
import { DocsIntro } from "@/design/Primitives";
import { CARD_INTERACTIVE, H4_CARD } from "@/design/system";
import Sidebar from "@/components/helpers/Sidebar";
import PlatformPills from "@/components/reference/PlatformPills";
import { reactNativeSidebarItems } from "@/services/Utils";
import { legacyComponentPlatforms } from "@/services/ui/component-reference";

const Components = () => {
  const items = reactNativeSidebarItems.filter((item: any) => item.isComponent);

  return (
    <Sidebar title="React Native Components">
      <DocsIntro
        lead="Build for iOS and Android with Nayan UI components. These examples use the same props and theme tokens as the React version."
        facts={[
          {
            value: String(items.length),
            label: "Component examples using the engine",
          },
        ]}
      />

      <NView tag="ul" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item: any) => {
          const Icon = item.icon;
          return (
            <NView tag="li" key={item.link}>
              <Link
                href={item.link}
                className={`${CARD_INTERACTIVE} group flex h-full flex-col gap-2 p-4`}
              >
                <PlatformPills platforms={legacyComponentPlatforms(item.link)} />
                <NText tag="span" className="flex items-center gap-2.5">
                  {Icon ? (
                    <Icon className="h-4 w-4 shrink-0 text-accent" />
                  ) : null}
                  <NText tag="span" className={H4_CARD}>{item.title}</NText>
                  <ArrowRight
                    aria-hidden
                    className="ml-auto h-3.5 w-3.5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
                  />
                </NText>
                <NText tag="span" className="line-clamp-2 text-sm leading-relaxed text-muted">
                  {item.description}
                </NText>
              </Link>
            </NView>
          );
        })}
      </NView>
    </Sidebar>
  );
};

export default Components;
