import { Github, Package } from 'lucide-react';
import Link from 'next/link';
import { CONTAINER, PILL_INTERACTIVE } from '@/design/system';

/*
 * The footer.
 *
 * The previous version's grid did not add up: the brand block took
 * `col-span-2` and there were four nav groups beside it — six units in a
 * five-column grid. So the fourth group wrapped onto a second row, sat alone
 * under the brand, and left the right two-thirds of the footer empty. That
 * void was most of why it looked wrong.
 *
 * Three nav groups now, so brand (2) + 3 = 5 and the row is full. React and
 * React Native are one "Documentation" column rather than two near-identical
 * three-link ones. A footer is a link index, so it should be scannable as
 * one: one heading style, one link style, no per-column colours.
 *
 * The npm packages were a stack of small grey monospace lines that read as
 * console output rather than links; they are pills on one row now.
 */

const GROUPS = [
  {
    title: 'Documentation',
    links: [
      { label: 'React installation', href: '/react/installation' },
      { label: 'React components', href: '/react/components' },
      { label: 'React Native installation', href: '/react-native/installation' },
      { label: 'React Native components', href: '/react-native/components' },
      { label: 'Component tags', href: '/tags' }
    ]
  },
  {
    title: 'Tools',
    links: [
      { label: 'Video Editor', href: '/video-editor' },
      { label: 'Games', href: '/games' },
      { label: 'Devtools', href: '/devtools' },
      { label: 'Sitemap generator', href: '/devtools/sitemap' },
      { label: 'Robots.txt generator', href: '/devtools/robots' }
    ]
  },
  {
    title: 'Project',
    links: [
      { label: 'Contributing', href: '/contributions' },
      { label: 'GitHub', href: 'https://github.com/ursnj/nayan-ui', external: true },
      { label: 'Report an issue', href: 'https://github.com/ursnj/nayan-ui/issues', external: true },
      { label: 'Discussions', href: 'https://github.com/ursnj/nayan-ui/discussions', external: true },
      { label: 'Releases', href: 'https://github.com/ursnj/nayan-ui/releases', external: true }
    ]
  }
];

const PACKAGES = [
  { label: 'react', href: 'https://www.npmjs.com/package/@nayan-ui/react' },
  { label: 'native', href: 'https://www.npmjs.com/package/@nayan-ui/native' },
  { label: 'cli', href: 'https://www.npmjs.com/package/@nayan-ui/cli' },
  { label: 'ai', href: 'https://www.npmjs.com/package/@nayan-ui/ai' }
];

const linkClass = 'text-sm text-muted transition-colors hover:text-indigo-600 dark:hover:text-indigo-400';

const slug = (value: string) => value.toLowerCase().replace(/\s+/g, '-');

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-default bg-surface/50">
      <div className={`${CONTAINER} py-14`}>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          {/* Brand */}
          <div className="sm:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <img src="/logo.webp" alt="" width={32} height={32} className="h-8 w-8" loading="lazy" />
              <span className="text-base font-bold text-foreground">Nayan UI</span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Open source React and React Native components, a browser video editor and a few developer tools. Free forever, MIT licensed.
            </p>

            <div className="mt-5">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                <Package aria-hidden className="h-3.5 w-3.5" />
                On npm
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {PACKAGES.map(pkg => (
                  <li key={pkg.label}>
                    <Link href={pkg.href} target="_blank" rel="noopener noreferrer" className={`${PILL_INTERACTIVE} font-mono`}>
                      {pkg.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="https://github.com/ursnj/nayan-ui"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-default bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-default/50">
              <Github aria-hidden className="h-4 w-4" />
              Star on GitHub
            </Link>
          </div>

          {/* Link index */}
          {GROUPS.map(group => (
            <nav key={group.title} aria-labelledby={`footer-${slug(group.title)}`}>
              <h2 id={`footer-${slug(group.title)}`} className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
                {group.title}
              </h2>
              <ul className="space-y-2.5">
                {group.links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={linkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-default pt-6 text-sm text-muted sm:flex-row">
          <p>© {year} Nayan UI</p>
          <div className="flex items-center gap-4">
            <Link href="https://github.com/ursnj/nayan-ui/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className={linkClass}>
              MIT License
            </Link>
            <span aria-hidden>·</span>
            <p>Made in India</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
