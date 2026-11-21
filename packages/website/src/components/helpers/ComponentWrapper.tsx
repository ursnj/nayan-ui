"use client";

import { NText, NView } from 'nayan-ui/components';
import { ArrowLeft, ArrowRight, Github } from "@/design/Icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PhoneFrame } from "@/design/Primitives";
import { CARD, LEAD } from "@/design/system";
import TagsList from "@/components/helpers/TagsList";
import { getMenuItem, getSidebarItems } from "@/services/Utils";
import { tagsForReference } from "@/services/nayan-ui/reference-tags";
import { REPO_URL } from "@/services/seo";
import Attributes from "./Attributes";
import Code from "./Code";
import Sidebar from "./Sidebar";
import SubHeader from "./SubHeader";

interface Props {
  children: any;
  /**
   * The usage sample, exported by the demo file next to the demo itself so the
   * two cannot drift. Falls back to the sidebar entry for pages that still keep
   * their sample there (the React Native ones, whose components cannot run in a
   * browser, so there is no demo to derive it from).
   */
  code?: string;
  attributes?: any[];
  extraAttributes?: { title: string; data: any[] }[];
}

const ComponentWrapper = (props: Props) => {
  const { children, code, attributes, extraAttributes } = props;
  const pathname = usePathname();
  const type = pathname.split("/")[1];
  const component: any = getMenuItem(pathname);

  const components = getSidebarItems(pathname).filter((item: any) => item.isComponent);
  const index = components.findIndex((item: any) => item.link === pathname);
  const previous: any = index > 0 ? components[index - 1] : null;
  const next: any = index >= 0 && index < components.length - 1 ? components[index + 1] : null;

  /** `react-native` maps to the `native` package; `react` to `react`. */
  const sourceUrl = REPO_URL;

  /*
   * `screenshot` names the light and dark captures for the native example app.
   */
  const slug = pathname.split("/").pop() ?? "";
  const screenshot: string | undefined =
    component.screenshot ?? (type === "react-native" ? slug : undefined);

  return (
    <Sidebar title={component.title}>
      <NText tag="p" className={`mb-8 max-w-3xl ${LEAD}`}>{component.description}</NText>

      <SubHeader
        title="Demo"
        description={
          type === "react-native"
            ? "React Native components render to native views, so this is the component running in the example app, in the theme you are reading in."
            : "Rendered live, with the same build of the library you install."
        }
      >
        {type === "react-native" && screenshot && component.hasScreenshot !== false ? (
          <PhoneFrame
            light={`/react-native/${screenshot}-light.png`}
            dark={`/react-native/${screenshot}-dark.png`}
            alt={`${component.title} running in the Nayan UI example app`}
          />
        ) : (
          <NView tag="div" className="space-y-4 [&>*]:max-w-full">{children}</NView>
        )}
      </SubHeader>

      <SubHeader
        title="Usage"
        action={
          <Link
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            <Github aria-hidden className="h-3.5 w-3.5" />
            Source
          </Link>
        }
      >
        <Code
          code={code ?? component.code}
          filename={`${component.title.replace(/\s+/g, "")}.tsx`}
        />
      </SubHeader>

      <Attributes data={attributes ?? component.attributes} />

      {(extraAttributes ?? component.extraAttributes ?? []).map((table: any) => (
        <Attributes key={table.title} title={table.title} data={table.data} />
      ))}

      <SubHeader title="Tags" description="Other components solving nearby problems.">
        <TagsList tags={tagsForReference(pathname)} />
      </SubHeader>

      {previous || next ? (
        <NView tag="nav"
          aria-label="Component navigation"
          className="mt-12 grid gap-3 border-t border-default pt-6 sm:grid-cols-2"
        >
          {previous ? (
            <Link
              href={previous.link}
              className={`${CARD} group flex flex-col p-4 transition-colors hover:border-accent/30`}
            >
              <NText tag="span" className="flex items-center gap-1.5 text-xs text-muted">
                <ArrowLeft
                  aria-hidden
                  className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
                />
                Previous
              </NText>
              <NText tag="span" className="mt-1 text-sm font-semibold text-foreground">{previous.title}</NText>
            </Link>
          ) : (
            <NText tag="span" aria-hidden />
          )}
          {next ? (
            <Link
              href={next.link}
              className={`${CARD} group flex flex-col items-end p-4 text-right transition-colors hover:border-accent/30 sm:col-start-2`}
            >
              <NText tag="span" className="flex items-center gap-1.5 text-xs text-muted">
                Next
                <ArrowRight
                  aria-hidden
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                />
              </NText>
              <NText tag="span" className="mt-1 text-sm font-semibold text-foreground">{next.title}</NText>
            </Link>
          ) : null}
        </NView>
      ) : null}
    </Sidebar>
  );
};

export default ComponentWrapper;
