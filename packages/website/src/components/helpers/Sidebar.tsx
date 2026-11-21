"use client";

import { ReactNode, useMemo, useState } from "react";
import { Menu, Search, X } from "@/design/Icons";
import { NInput, NPress, NText, NView } from "nayan-ui/components";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Breadcrumb } from "@/design/Primitives";
import { H1 } from "@/design/system";
import { getSidebarItems, type SidebarItem } from "@/services/Utils";

interface Props {
  title?: string;
  reference?: { title: string; href: string; items: SidebarItem[] };
  children: ReactNode;
}

/** Names the section a docs path belongs to, for the breadcrumb. */
const SECTION_LABELS: Record<string, string> = {
  react: "React",
  "react-native": "React Native",
  games: "Nayan Games",
  "game-engine": "Nayan Game Engine",
  tools: "Tools",
};

/** Counts the non-heading items that belong to a heading (until the next heading). */
const countChildren = (items: SidebarItem[], headingIndex: number) => {
  let count = 0;
  for (let i = headingIndex + 1; i < items.length; i++) {
    if (items[i].isHeading) break;
    count++;
  }
  return count;
};

const SidebarNav = ({
  items,
  allItems,
  pathname,
  query,
  setQuery,
  onNavigate,
}: {
  items: SidebarItem[];
  allItems: SidebarItem[];
  pathname: string;
  query: string;
  setQuery: (q: string) => void;
  onNavigate?: () => void;
}) => (
  <>
    <NView tag="div" className="border-b border-border p-3">
      <NView tag="label" className="relative block">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
        />
        <NInput
          type="search"
          accessibilityLabel="Filter pages"
          value={query}
          onChangeText={setQuery}
          placeholder="Filter pages…"
          className="site-docs-filter w-full rounded-lg border border-default bg-background py-1.5 pl-8 pr-8 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent/60"
        />
        {query ? (
          <NPress
            onPress={() => setQuery("")}
            aria-label="Clear filter"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </NPress>
        ) : null}
      </NView>
    </NView>

    <NView
      tag="div"
      className="site-docs-list overflow-y-auto p-3 [overscroll-behavior-y:contain] [scrollbar-width:thin]"
      style={{ maxHeight: 'calc(100dvh - var(--site-header-height) - 5.25rem)' }}
    >
      {items.length === 0 ? (
        <NText tag="p" className="px-2 py-6 text-center text-xs text-muted">
          Nothing matches &ldquo;{query}&rdquo;.
        </NText>
      ) : (
        items.map((item, index) => {
          const Icon = item.icon;

          if (item.isHeading) {
            const childCount = countChildren(allItems, allItems.indexOf(item));
            return (
              <NView tag="div"
                key={item.link || `heading-${index}`}
                className="flex items-center justify-between px-2.5 pb-1 pt-3 first:pt-0"
              >
                <NText tag="span" className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {item.navTitle ?? item.title}
                </NText>
                {childCount > 0 ? (
                  <NText tag="span" className="rounded-full bg-default/60 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted">
                    {childCount}
                  </NText>
                ) : null}
              </NView>
            );
          }

          const active = pathname === item.link;
          return (
            <Link
              key={item.link}
              href={item.link}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors ${
                active
                  ? "bg-accent/10 font-semibold text-accent"
                  : "text-muted hover:bg-default/50 hover:text-foreground"
              }`}
            >
              {Icon ? (
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    active
                      ? "text-accent"
                      : "text-muted/60 group-hover:text-foreground"
                  }`}
                />
              ) : null}
              <NText tag="span" className="truncate">{item.title}</NText>
            </Link>
          );
        })
      )}
    </NView>
  </>
);

const Sidebar = (props: Props) => {
  const pathname = usePathname();
  const sidebarItems = props.reference?.items ?? getSidebarItems(pathname);
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return sidebarItems;

    const matched = sidebarItems.filter(
      (item) => !item.isHeading && item.title.toLowerCase().includes(term),
    );
    return sidebarItems.filter((item) => {
      if (!item.isHeading) return matched.includes(item);
      const start = sidebarItems.indexOf(item);
      for (let i = start + 1; i < sidebarItems.length; i++) {
        if (sidebarItems[i].isHeading) break;
        if (matched.includes(sidebarItems[i])) return true;
      }
      return false;
    });
  }, [query, sidebarItems]);

  const section = pathname.split("/")[1];
  const sectionLabel = props.reference?.title ?? SECTION_LABELS[section];

  const breadcrumb: { label: string; href?: string }[] = [{ label: "Home", href: "/" }];
  // A section's own landing page (e.g. "Nayan Game Engine" at /game-engine) shows its title once.
  if (sectionLabel && sectionLabel !== props.title)
    breadcrumb.push({ label: sectionLabel, href: props.reference?.href ?? `/${section}` });
  if (props.title) breadcrumb.push({ label: props.title });

  return (
    <NView tag="div" className="mx-auto w-full max-w-[82rem] p-3">
      <NView tag="div" className="grid grid-cols-1 gap-3 md:grid-cols-[13rem_minmax(0,1fr)] lg:grid-cols-[15rem_minmax(0,1fr)]">
        {/* Desktop sidebar */}
        <NView tag="nav" aria-label="Documentation" className="hidden md:block">
          <NView
            tag="div"
            className="site-docs-navigation sticky rounded-xl border border-border bg-surface"
            style={{ top: 'calc(var(--site-header-height) + 0.75rem)' }}
          >
            <SidebarNav
              items={items}
              allItems={sidebarItems}
              pathname={pathname}
              query={query}
              setQuery={setQuery}
            />
          </NView>
        </NView>

        <NView tag="div" className="content grid min-w-0 grid-cols-1 content-start gap-3">
          {/* Mobile sidebar toggle */}
          <NView tag="div" className="md:hidden">
            <NPress
              onPress={() => setMobileOpen((open) => !open)}
              aria-expanded={mobileOpen}
              className="inline-flex flex-row items-center gap-2 rounded-lg border border-default bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-default/50"
            >
              <Menu className="h-4 w-4" />
              Browse pages
            </NPress>
          </NView>

          {/* Mobile sidebar drawer */}
          {mobileOpen ? (
            <NView tag="nav"
              aria-label="Documentation"
              className="rounded-xl border border-border bg-surface md:hidden"
            >
              <SidebarNav
                items={items}
                allItems={sidebarItems}
                pathname={pathname}
                query={query}
                setQuery={setQuery}
                onNavigate={() => setMobileOpen(false)}
              />
            </NView>
          ) : null}

          <NView tag="header" className="site-docs-heading grid gap-3">
            <Breadcrumb items={breadcrumb} className="" />
            {props.title && <NText tag="h1" className={H1}>{props.title}</NText>}
          </NView>
          <NView tag="div">{props.children}</NView>
        </NView>
      </NView>
    </NView>
  );
};

export default Sidebar;
