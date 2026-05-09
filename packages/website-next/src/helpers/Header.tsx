'use client';

import { useEffect, useState } from 'react';
import { NSheet, THEMES, useLocalStorage } from '@nayan-ui/react';
import { AlignJustify, Github, MoonStar, Package, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { reactSidebarItems } from '@/services/Utils';

const HeaderMenu = () => {
  const [theme, setTheme] = useLocalStorage('THEME', THEMES.LIGHT);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const linkClass = (path: string) =>
    `text-sm font-medium px-4 py-2.5 block md:inline rounded-lg transition-all duration-200 ${isActive(path) ? 'text-blue-600 dark:text-blue-400 bg-gradient-to-r from-blue-500/10 to-purple-500/10 shadow-sm' : 'text-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:bg-default/50'}`;

  return (
    <div className="w-full flex flex-col md:flex-row justify-between items-center">
      <ul className="w-full md:w-auto flex flex-col md:flex-row items-center">
        <li className="w-full md:w-auto">
          <Link className={linkClass('/')} href="/">
            Home
          </Link>
        </li>
        <li className="w-full md:w-auto">
          <Link className={linkClass('/react/installation')} href="/react/installation">
            React
          </Link>
        </li>
        <li className="w-full md:w-auto">
          <Link className={linkClass('/react-native/installation')} href="/react-native/installation">
            React Native
          </Link>
        </li>
        <li className="w-full md:w-auto">
          <Link className={linkClass('/games')} href="/games">
            Games
          </Link>
        </li>
        <li className="w-full md:w-auto">
          <Link className={linkClass('/devtools')} href="/devtools">
            Devtools
          </Link>
        </li>
      </ul>
      <div className="w-full md:w-auto flex items-center justify-center md:justify-end gap-4 mt-3 md:mt-0">
        <Link
          href="https://www.github.com/ursnj/nayan-ui"
          target="_blank"
          title="Nayan UI Github"
          aria-label="Nayan UI Github"
          className="p-2 rounded-lg hover:bg-default/50 transition-colors">
          <Github className="w-5 h-5 text-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors inline" />
        </Link>
        <span tabIndex={0} className="p-2 rounded-lg hover:bg-default/50 transition-colors cursor-pointer" onClick={toggleTheme} title="Theme Switch">
          {mounted && theme !== THEMES.DARK && <MoonStar className="w-5 h-5 text-foreground hover:text-amber-500 transition-colors inline" />}
          {mounted && theme === THEMES.DARK && <Sun className="w-5 h-5 text-foreground hover:text-amber-400 transition-colors inline" />}
          {!mounted && <span className="w-5 h-5 inline-block" />}
        </span>
      </div>

      <div className="w-full block md:hidden mt-4 mb-4">
        {reactSidebarItems.map(item => {
          const Icon = item.icon as any;
          return (
            <div key={item.link}>
              {!item.isHeading && (
                <Link href={item.link}>
                  <div className="rounded cursor-pointer hover:bg-default p-1.5 px-3 flex items-center">
                    <Icon className="w-4 h-4 inline mr-3" />
                    <span>{item.title}</span>
                  </div>
                </Link>
              )}
              {!!item.isHeading && <div className="text-sm font-semibold text-muted uppercase tracking-wide p-2 pt-4">{item.title}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Header = () => {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <header className="bg-surface/80 backdrop-blur-md fixed top-0 left-0 right-0 z-40 border-b border-default">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <NSheet isOpen={menu} title="Nayan UI" onCloseSheet={() => setMenu(false)}>
          <HeaderMenu />
        </NSheet>
        <nav className="flex flex-row py-2.5 justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-3 shrink-0 mr-5">
              <img
                src="/logo.webp"
                fetchPriority="high"
                className="inline-block align-top"
                alt="Nayan UI Logo"
                loading="lazy"
                width={40}
                height={40}
              />
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent hidden sm:inline whitespace-nowrap">
                Nayan UI
              </span>
            </div>
          </Link>
          <div className="block md:hidden p-2" onClick={() => setMenu(true)}>
            <AlignJustify className="w-6 h-6 text-foreground" />
          </div>
          <div className="w-full hidden md:block">
            <HeaderMenu />
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
