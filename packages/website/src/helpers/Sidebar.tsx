"use client";

import { ReactNode, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
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

const Sidebar = (props: Props) => {
  const pathname = usePathname();
  const sidebarItems = getSidebarItems(pathname);
  const [query, setQuery] = useState("");

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
        <nav aria-label="Documentation" className="col-span-12 hidden md:block md:col-span-3">
          <div className="sticky top-[76px] rounded-2xl border border-default bg-surface">
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
                  placeholder="Filter…"
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
                  Nothing matches “{query}”.
                </p>
              ) : (
                items.map((item, index) => {
                  const Icon = item.icon as any;

                  if (item.isHeading) {
                    return (
                      <div
                        key={item.link || `heading-${index}`}
                        className="px-2 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted first:pt-1"
                      >
                        {item.title}
                      </div>
                    );
                  }

                  const active = pathname === item.link;
                  return (
                    <Link
                      key={item.link}
                      href={item.link}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                        active
                          ? "bg-indigo-500/10 font-medium text-indigo-600 dark:text-indigo-400"
                          : "text-muted hover:bg-default/60 hover:text-foreground"
                      }`}
                    >
                      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                      <span className="truncate">{item.title}</span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </nav>

        <div className="content col-span-12 min-w-0 md:col-span-9">
          <Breadcrumb items={breadcrumb} />
          {props.title && <h1 className={`mb-4 ${H1}`}>{props.title}</h1>}
          <div>{props.children}</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
