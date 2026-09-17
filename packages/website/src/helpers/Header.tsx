'use client';

import { useEffect, useState } from 'react';
import { NSheet, THEMES, useLocalStorage } from '@nayan-ui/react';
import { AlignJustify, Github, MoonStar, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CONTAINER } from '@/design/system';

/**
 * The primary navigation, in one place.
 *
 * `/react` and `/react-native` point at their installation pages because that
 * is where a first visit should land; `isActive` still matches the whole
 * subtree, so every component page keeps the section lit.
 */
const NAV = [
  { label: 'Home', href: '/', match: '/' },
  { label: 'React', href: '/react/installation', match: '/react' },
  { label: 'React Native', href: '/react-native/installation', match: '/react-native' },
  { label: 'Games', href: '/games', match: '/games' },
  { label: 'Video Editor', href: '/video-editor', match: '/video-editor' },
  { label: 'Devtools', href: '/devtools', match: '/devtools' }
];

/**
 * `/react-native` starts with `/react`, so a plain `startsWith` lights both.
 * Matching on the segment boundary is what keeps React Native from making the
 * React tab look active too.
 */
const isActive = (pathname: string, match: string) => {
  if (match === '/') return pathname === '/';
  return pathname === match || pathname.startsWith(`${match}/`);
};

const NavLinks = ({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) => (
  <ul className="flex flex-col gap-1 md:flex-row md:items-center">
    {NAV.map(item => {
      const active = isActive(pathname, item.match);
      return (
        <li key={item.href} className="w-full md:w-auto">
          <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-muted hover:bg-default/60 hover:text-foreground'
            }`}>
            {item.label}
          </Link>
        </li>
      );
    })}
  </ul>
);

/**
 * The site header.
 *
 * The gradient hairline along the bottom edge is gone, as is the gradient on
 * the wordmark. Both were competing with whatever the page itself was trying
 * to lead with, and the header is chrome — it should be the least interesting
 * thing on screen.
 *
 * The mobile sheet no longer carries a copy of the entire React component
 * list. That list is the sidebar's job, it was only ever the React one
 * regardless of which section you were in, and it made the menu a
 * fifty-item scroll to reach "Devtools".
 */
const Header = () => {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [theme, setTheme] = useLocalStorage('THEME', THEMES.LIGHT);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  const toggleTheme = () => setTheme(theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-default bg-surface/80 backdrop-blur-md">
      <div className={CONTAINER}>
        <NSheet isOpen={menu} title="Nayan UI" onCloseSheet={() => setMenu(false)}>
          <NavLinks pathname={pathname} onNavigate={() => setMenu(false)} />
        </NSheet>

        <nav aria-label="Main" className="flex h-[59px] items-center justify-between gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <img src="/logo.webp" fetchPriority="high" alt="" width={32} height={32} className="h-8 w-8" />
            <span className="hidden whitespace-nowrap text-base font-bold text-foreground sm:inline">Nayan UI</span>
          </Link>

          <div className="hidden md:block">
            <NavLinks pathname={pathname} />
          </div>

          <div className="flex items-center gap-1">
            <Link
              href="https://www.github.com/ursnj/nayan-ui"
              target="_blank"
              rel="noopener noreferrer"
              title="Nayan UI on GitHub"
              aria-label="Nayan UI on GitHub"
              className="rounded-lg p-2 text-muted transition-colors hover:bg-default/60 hover:text-foreground">
              <Github className="h-[18px] w-[18px]" />
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              title="Switch theme"
              aria-label="Switch theme"
              className="rounded-lg p-2 text-muted transition-colors hover:bg-default/60 hover:text-foreground">
              {/* Sized identically before mount, so the row does not shift once the stored theme is known. */}
              {!mounted ? (
                <span className="block h-[18px] w-[18px]" />
              ) : theme === THEMES.DARK ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <MoonStar className="h-[18px] w-[18px]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setMenu(true)}
              aria-label="Open menu"
              className="rounded-lg p-2 text-muted transition-colors hover:bg-default/60 hover:text-foreground md:hidden">
              <AlignJustify className="h-5 w-5" />
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
