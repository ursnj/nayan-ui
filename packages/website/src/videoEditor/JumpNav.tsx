import { NAV_SECTIONS } from './content';

/**
 * In-page navigation for a long page.
 *
 * Plain anchors, so it works with no JavaScript and each section is
 * linkable on its own. `top-[60px]` clears the site header, which is fixed at
 * that height; the scroll padding that keeps a targeted heading from landing
 * underneath this bar is set on `html` in the page's own styles.
 */
const JumpNav = () => (
  <nav aria-label="On this page" className="sticky top-[60px] z-30 border-y border-default bg-surface/80 backdrop-blur-md">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <ul className="-mx-1 flex gap-1 overflow-x-auto py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NAV_SECTIONS.map(section => (
          <li key={section.id} className="shrink-0">
            <a
              href={`#${section.id}`}
              className="block whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-default/60 hover:text-foreground">
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  </nav>
);

export default JumpNav;
