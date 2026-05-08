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

  const toggleTheme = () => {
    setTheme(theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
  };

  const linkClass = (path: string) =>
    `text-sm font-medium text-foreground px-4 py-2.5 block md:inline rounded-lg hover:bg-default/50 transition-colors ${pathname === path ? 'active' : ''}`;

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
            React JS
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
        <li className="w-full md:w-auto">
          <Link className={linkClass('/contributions')} href="/contributions">
            Contributions
          </Link>
        </li>
      </ul>
      <div className="w-full md:w-auto flex items-center justify-center md:justify-end gap-4 mt-3 md:mt-0">
        <Link href="https://www.github.com/ursnj/nayan-ui" target="_blank" title="Nayan UI Github" aria-label="Nayan UI Github">
          <Github className="w-5 h-5 text-foreground inline" />
        </Link>
        <span tabIndex={0} className="text cursor-pointer" onClick={toggleTheme} title="Theme Switch">
          {theme !== THEMES.DARK && <MoonStar className="w-5 h-5 text-foreground inline" />}
          {theme === THEMES.DARK && <Sun className="w-5 h-5 text-foreground inline" />}
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
    <header className="bg-surface fixed top-0 left-0 right-0 z-40 border-b border-default">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <NSheet isOpen={menu} title="Nayan UI" onCloseSheet={() => setMenu(false)}>
          <HeaderMenu />
        </NSheet>
        <nav className="flex flex-row py-2.5 justify-between items-center">
          <Link href="/">
            <img
              src="/logo.webp"
              fetchPriority="high"
              className="inline-block align-top mr-4"
              alt="Nayan UI Logo"
              loading="lazy"
              width={50}
              height={50}
            />
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
