import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { NSheet, THEMES, useLocalStorage } from '@nayan-ui/react';
import { AlignJustify, Github, MoonStar, Package, Sun } from 'lucide-react';
import { reactSidebarItems } from '../services/Utils';

const HeaderMenu = () => {
  const [theme, setTheme] = useLocalStorage('THEME', THEMES.LIGHT);

  const toggleTheme = () => {
    setTheme(theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
  };

  return (
    <div className="w-full flex flex-col md:flex-row justify-between items-center">
      <ul className="w-full md:w-auto flex flex-col md:flex-row items-center">
        <li className="w-full md:w-auto">
          <NavLink className="text-base font-medium text-text px-3 py-3 block md:inline" to="/">
            Home
          </NavLink>
        </li>
        <li className="w-full md:w-auto">
          <NavLink className="text-base font-medium text-text px-3 py-3 block md:inline" to="/react/installation">
            React JS
          </NavLink>
        </li>
        <li className="w-full md:w-auto">
          <NavLink className="text-base font-medium text-text px-3 py-3 block md:inline" to="/react-native/installation">
            React Native
          </NavLink>
        </li>
        <li className="w-full md:w-auto">
          <NavLink className="text-base font-medium text-text px-3 py-3 block md:inline" to="/devtools">
            Devtools
          </NavLink>
        </li>
        <li className="w-full md:w-auto">
          <NavLink className="text-base font-medium text-text px-3 py-3 block md:inline" to="/games">
            Games
          </NavLink>
        </li>
        <li className="w-full md:w-auto">
          <NavLink className="text-base font-medium text-text px-3 py-3 block md:inline" to="/contributions">
            Contributions
          </NavLink>
        </li>
      </ul>
      <div className="w-full md:w-auto form-inline md:text-center md:justify-center items-center mt-3 md:mt-0">
        <Link to="https://www.github.com/ursnj/nayan-ui" target="_blank" className="mr-5" title="Nayan UI Github" aria-label="Nayan UI Github">
          <Github className="w-6 h-6 text-text inline" />
        </Link>
        <span tabIndex={0} className="text cursor-pointer" onClick={toggleTheme} title="Theme Switch">
          {theme !== THEMES.DARK && <MoonStar className="w-6 h-6 text-text inline" />}
          {theme === THEMES.DARK && <Sun className="w-6 h-6 text-text inline" />}
        </span>
      </div>

      <div className="w-full block md:hidden mt-5 mb-5">
        {reactSidebarItems.map(item => {
          const Icon = item.icon as any;
          return (
            <div key={item.link}>
              {!item.isHeading && (
                <Link to={item.link}>
                  <div className="rounded cursor-pointer hover:bg-border p-1.5 px-3 flex items-center">
                    <Icon className="w-4 h-4 inline mr-3" />
                    <span>{item.title}</span>
                  </div>
                </Link>
              )}
              {!!item.isHeading && <div className="text-lg p-2">{item.title}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Header = () => {
  const location = useLocation();
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    setMenu(false);
    // @ts-ignore
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <header className="bg-card fixed top-0 left-0 right-0 z-40 shadow">
      <div className="container mx-auto">
        <NSheet isOpen={menu} title="Nayan UI" onCloseSheet={() => setMenu(false)}>
          <HeaderMenu />
        </NSheet>
        <nav className="flex flex-row py-2.5 justify-between items-center">
          <Link to="/">
            <img src="/logo.webp" fetchPriority="high" className="d-inline-block align-top main-logo mr-6" alt="Nayan UI Logo" loading="lazy" width={50} height={50} />
          </Link>
          <div className="block md:hidden p-2" onClick={() => setMenu(true)}>
            <AlignJustify className="w-6 h-6 text-text" />
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
