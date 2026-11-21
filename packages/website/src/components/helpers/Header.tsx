"use client";

import { useEffect, useRef, useState } from "react";
import { NImage, NPress, NText, NView } from "nayan-ui/components";
import { AlignJustify, Github, MoonStar, Package, Sun, X } from "@/design/Icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CONTAINER } from "@/design/system";
import { REPO_URL } from "@/services/seo";
import { useTheme } from "@/components/helpers/ThemeProvider";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Components", href: "/components" },
  { label: "Modules", href: "/modules" },
  { label: "Game Engine", href: "/game-engine" },
  { label: "Games", href: "/games" },
  { label: "Playground", href: "/game-engine/playground" },
  { label: "Video Editor", href: "/video-editor" },
];

const NavLinks = ({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) => {
  const activeHref = NAV.filter(({ href }) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((first, second) => second.href.length - first.href.length)[0]?.href;

  return (
    <NView tag="ul" className="site-nav-list">
      {NAV.map(({ label, href }) => {
        const active = href === activeHref;
        return (
          <NView tag="li" key={href} className="site-nav-item">
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`site-nav-link block text-sm font-medium whitespace-nowrap transition-colors ${
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-default/60 hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          </NView>
        );
      })}
    </NView>
  );
};

const Header = () => {
  const pathname = usePathname();
  const menu = useRef<HTMLDialogElement>(null);
  const closeMenu = () => menu.current?.close();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Back and forward keep the page where it was; only new navigations start at the top.
  const historyNavigation = useRef(false);
  useEffect(() => {
    const onPopState = () => {
      historyNavigation.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    menu.current?.close();
    if (historyNavigation.current) {
      historyNavigation.current = false;
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <NView
      tag="header"
      className="site-header fixed inset-x-0 top-0 z-40 border-b border-border backdrop-blur-xl"
    >
      <NView tag="div" className={CONTAINER}>
        <NView tag="dialog"
          id="site-menu"
          ref={menu}
          aria-labelledby="site-menu-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeMenu();
          }}
          className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85dvh] w-full max-w-none rounded-t-2xl border border-border bg-surface p-0 text-foreground backdrop:bg-black/50"
        >
          <NView tag="div" className="p-4">
            <NView tag="div" className="mb-3 flex items-center justify-between">
              <NText tag="h2" id="site-menu-title" className="font-bold">
                Nayan UI
              </NText>
              <NPress
                onPress={closeMenu}
                aria-label="Close menu"
                className="rounded-lg p-2 hover:bg-default/60"
              >
                <X className="h-5 w-5" />
              </NPress>
            </NView>
            <NView tag="nav" aria-label="Mobile">
              <NavLinks pathname={pathname} onNavigate={closeMenu} />
            </NView>
          </NView>
        </NView>

        <NView tag="div" className="site-header-row flex items-center justify-between gap-3 lg:gap-6">
          <Link href="/" aria-label="Nayan UI home" className="flex shrink-0 items-center gap-2.5">
            <NImage src="/logo.webp" priority alt="" width={32} height={32} className="site-logo h-8 w-8" />
            <NText tag="span" className="whitespace-nowrap text-lg font-bold tracking-[-0.045em] text-foreground">
              Nayan UI
            </NText>
          </Link>

          <NView tag="nav" aria-label="Main" className="site-desktop-nav">
            <NavLinks pathname={pathname} />
          </NView>

          <NView tag="div" className="site-header-actions">
            <Link
              href="https://www.npmjs.com/package/nayan-ui"
              target="_blank"
              rel="noopener noreferrer"
              title="Nayan UI on npm"
              aria-label="Nayan UI on npm"
              className="inline-grid site-header-action"
            >
              <Package className="h-[18px] w-[18px]" />
            </Link>
            <Link
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="Nayan UI on GitHub"
              aria-label="Nayan UI on GitHub"
              className="inline-grid site-header-action"
            >
              <Github className="h-[18px] w-[18px]" />
            </Link>
            <NPress
              onPress={toggleTheme}
              title="Switch theme"
              aria-label="Switch theme"
              className="inline-grid site-header-action"
            >
              {!mounted ? (
                <NText tag="span" className="block h-[18px] w-[18px]" />
              ) : theme === "dark" ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <MoonStar className="h-[18px] w-[18px]" />
              )}
            </NPress>
            <NPress
              onPress={() => menu.current?.showModal()}
              aria-haspopup="dialog"
              aria-controls="site-menu"
              aria-label="Open menu"
              className="inline-grid site-header-action site-mobile-toggle"
            >
              <AlignJustify className="h-5 w-5" />
            </NPress>
          </NView>
        </NView>
      </NView>
    </NView>
  );
};

export default Header;
