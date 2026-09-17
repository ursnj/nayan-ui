import { Github } from 'lucide-react';
import Link from 'next/link';
import { CONTAINER } from '@/design/system';

/**
 * The footer.
 *
 * Restructured around one idea: a footer is a link index, so it should be
 * scannable as one. Previously each column's heading took a different colour
 * — blue, purple, pink — and every link in it hovered to that same colour,
 * which implied three groups of links that behaved differently. They do not.
 * One heading style, one link style, four groups.
 *
 * Also no longer a client component. It held no state; the only reason it
 * needed hydrating was `NLink`, and these are ordinary links.
 */
const GROUPS = [
  {
    title: 'React',
    links: [
      { label: 'Installation', href: '/react/installation' },
      { label: 'Components', href: '/react/components' },
      { label: 'Component tags', href: '/tags' }
    ]
  },
  {
    title: 'React Native',
    links: [
      { label: 'Installation', href: '/react-native/installation' },
      { label: 'Components', href: '/react-native/components' },
      { label: 'Games', href: '/games' }
    ]
  },
  {
    title: 'Tools',
    links: [
      { label: 'Video Editor', href: '/video-editor' },
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
  { label: '@nayan-ui/react', href: 'https://www.npmjs.com/package/@nayan-ui/react' },
  { label: '@nayan-ui/native', href: 'https://www.npmjs.com/package/@nayan-ui/native' },
  { label: '@nayan-ui/cli', href: 'https://www.npmjs.com/package/@nayan-ui/cli' }
];

const linkClass = 'text-sm text-muted transition-colors hover:text-indigo-600 dark:hover:text-indigo-400';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-default bg-surface/60">
      <div className={`${CONTAINER} py-12`}>
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <img src="/logo.webp" alt="" width={32} height={32} className="h-8 w-8" loading="lazy" />
              <span className="text-base font-bold text-foreground">Nayan UI</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Open source, accessible React and React Native components — plus a browser video editor and a handful of developer tools. Free forever,
              MIT licensed.
            </p>

            <ul className="mt-5 space-y-1.5">
              {PACKAGES.map(pkg => (
                <li key={pkg.label}>
                  <Link href={pkg.href} target="_blank" rel="noopener noreferrer" className={`font-mono text-xs ${linkClass}`}>
                    {pkg.label}
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href="https://github.com/ursnj/nayan-ui"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Nayan UI on GitHub"
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-default bg-surface px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground">
              <Github aria-hidden className="h-4 w-4" />
              Star on GitHub
            </Link>
          </div>

          {GROUPS.map(group => (
            <nav key={group.title} aria-labelledby={`footer-${group.title.replace(/\s+/g, '-').toLowerCase()}`}>
              <h2
                id={`footer-${group.title.replace(/\s+/g, '-').toLowerCase()}`}
                className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
                {group.title}
              </h2>
              <ul className="space-y-2">
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

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-default pt-6 text-sm text-muted sm:flex-row">
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
