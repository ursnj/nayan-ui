"use client";

import { ReactNode, useMemo, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Breadcrumb } from "@/design/Primitives";
import { CONTAINER, H1 } from "@/design/system";
import { getSidebarItems } from "@/services/Utils";

interface Props {
  title?: string;
  children: ReactNode;
}

/** Names the section a docs path belongs to, for the breadcrumb. */
const SECTION_LABELS: Record<string, string> = {
  react: "React",
  "react-native": "React Native",
  games: "Games",
  devtools: "Devtools",
};

/** Counts the non-heading items that belong to a heading (until the next heading). */
const countChildren = (items: any[], headingIndex: number) => {
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
  items: any[];
  allItems: any[];
  pathname: string;
  query: string;
  setQuery: (q: string) => void;
  onNavigate?: () => void;
}) => (
  <>
    <div className="border-b border-default p-3">
      <label className="relative block">
        <span className="sr-only">Filter pages</span>
        <Search
          aria-hidden
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter..."
          className="w-full rounded-lg border border-default bg-background py-1.5 pl-8 pr-8 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-indigo-500/50"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear filter"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </label>
    </div>

    <div className="max-h-[calc(100vh-11rem)] overflow-y-auto p-2">
      {items.length === 0 ? (
        <p className="px-2 py-6 text-center text-xs text-muted">
          Nothing matches &ldquo;{query}&rdquo;.
        </p>
      ) : (
        items.map((item: any, index: number) => {
          const Icon = item.icon as any;

          if (item.isHeading) {
            const childCount = countChildren(allItems, allItems.indexOf(item));
            return (
              <div
                key={item.link || `heading-${index}`}
                className="flex items-center justify-between px-2.5 pb-1 pt-5 first:pt-2"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {item.title}
                </span>
                {childCount > 0 ? (
                  <span className="rounded-full bg-default/60 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted">
                    {childCount}
                  </span>
                ) : null}
              </div>
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
                  ? "bg-indigo-500/10 font-medium text-indigo-600 dark:text-indigo-400"
                  : "text-muted hover:bg-default/50 hover:text-foreground"
              }`}
            >
              {Icon ? (
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    active
                      ? "text-indigo-500 dark:text-indigo-400"
                      : "text-muted/60 group-hover:text-foreground"
                  }`}
                />
              ) : null}
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })
      )}
    </div>
  </>
);

const Sidebar = (props: Props) => {
  const pathname = usePathname();
  const sidebarItems = getSidebarItems(pathname);
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
  const sectionLabel = SECTION_LABELS[section];

  const breadcrumb: { label: string; href?: string }[] = [{ label: "Home", href: "/" }];
  if (sectionLabel) breadcrumb.push({ label: sectionLabel, href: `/${section}` });
  if (props.title) breadcrumb.push({ label: props.title });

  return (
    <div className={`${CONTAINER} py-6 sm:py-8`}>
      <div className="grid grid-cols-12 gap-6 lg:gap-8">
        {/* Desktop sidebar */}
        <nav aria-label="Documentation" className="col-span-12 hidden md:block md:col-span-3">
          <div className="sticky top-[76px] rounded-2xl border border-default bg-surface">
            <SidebarNav
              items={items}
              allItems={sidebarItems}
              pathname={pathname}
              query={query}
              setQuery={setQuery}
            />
          </div>
        </nav>

        <div className="content col-span-12 min-w-0 md:col-span-9">
          {/* Mobile sidebar toggle */}
          <div className="mb-4 md:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="inline-flex items-center gap-2 rounded-lg border border-default bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-default/50"
            >
              <Menu className="h-4 w-4" />
              Navigation
            </button>
          </div>

          {/* Mobile sidebar drawer */}
          {mobileOpen ? (
            <nav
              aria-label="Documentation"
              className="mb-6 rounded-2xl border border-default bg-surface md:hidden"
            >
              <SidebarNav
                items={items}
                allItems={sidebarItems}
                pathname={pathname}
                query={query}
                setQuery={setQuery}
                onNavigate={() => setMobileOpen(false)}
              />
            </nav>
          ) : null}

          <Breadcrumb items={breadcrumb} />
          {props.title && <h1 className={`mb-4 ${H1}`}>{props.title}</h1>}
          <div>{props.children}</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
