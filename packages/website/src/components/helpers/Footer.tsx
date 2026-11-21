import { Github, Package } from "lucide-react";
import Link from "next/link";
import { NImage, NText, NView } from "@nayan-ui/engine/components";
import { CONTAINER, PILL_INTERACTIVE } from "@/design/system";
import { REPO_URL } from "@/services/seo";

const GROUPS = [
  {
    title: "Documentation",
    links: [
      { label: "Nayan Engine", href: "/game-engine" },
      { label: "React installation", href: "/react/installation" },
      { label: "React components", href: "/react/components" },
      { label: "React Native installation", href: "/react-native/installation" },
      { label: "React Native components", href: "/react-native/components" },
      { label: "Component tags", href: "/tags" },
    ],
  },
  {
    title: "Tools",
    links: [
      { label: "Video Editor", href: "/video-editor" },
      { label: "Games", href: "/games" },
      { label: "Tools", href: "/tools" },
      { label: "Sitemap generator", href: "/tools/sitemap-generator" },
      { label: "Robots.txt generator", href: "/tools/robots-generator" },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "Contributing", href: "/contributions" },
      { label: "GitHub", href: REPO_URL, external: true },
    ],
  },
];

const PACKAGES = [
  { label: "react", href: "https://www.npmjs.com/package/@nayan-ui/react" },
  { label: "native", href: "https://www.npmjs.com/package/@nayan-ui/native" },
  { label: "engine", href: "https://www.npmjs.com/package/@nayan-ui/engine" },
  { label: "cli", href: "https://www.npmjs.com/package/@nayan-ui/cli" },
  { label: "ai", href: "https://www.npmjs.com/package/@nayan-ui/ai" },
];

const linkClass =
  "text-sm text-muted transition-colors hover:text-indigo-600 dark:hover:text-indigo-400";

const slug = (value: string) => value.toLowerCase().replace(/\s+/g, "-");

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <NView tag="footer" className="mt-20 border-t border-default bg-surface/50">
      <NView tag="div" className={`${CONTAINER} py-14`}>
        <NView tag="div" className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          <NView tag="div" className="sm:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <NImage
                src="/logo.webp"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8"
                loading="lazy"
              />
              <span className="text-base font-bold text-foreground">Nayan UI</span>
            </Link>

            <NText tag="p" className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              An open source engine for cross-platform UI and 3D games, plus 50+ playable games, a
              browser video editor and free developer tools.
            </NText>

            <NView tag="div" className="mt-5">
              <NText
                tag="p"
                className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted"
              >
                <Package aria-hidden className="h-3.5 w-3.5" />
                On npm
              </NText>
              <ul className="flex flex-wrap gap-1.5">
                {PACKAGES.map((pkg) => (
                  <li key={pkg.label}>
                    <Link
                      href={pkg.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${PILL_INTERACTIVE} font-mono`}
                    >
                      {pkg.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </NView>

            <Link
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-default bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-default/50"
            >
              <Github aria-hidden className="h-4 w-4" />
              Star on GitHub
            </Link>
          </NView>

          {GROUPS.map((group) => (
            <NView tag="nav" key={group.title} aria-labelledby={`footer-${slug(group.title)}`}>
              <NText
                tag="h2"
                id={`footer-${slug(group.title)}`}
                className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground"
              >
                {group.title}
              </NText>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className={linkClass}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </NView>
          ))}
        </NView>

        <NView
          tag="div"
          className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-default pt-6 text-sm text-muted sm:flex-row"
        >
          <NText tag="p">© {year} Nayan UI</NText>
          <NView tag="div" className="flex items-center gap-4">
            <Link href={REPO_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
              MIT License
            </Link>
            <span aria-hidden>·</span>
            <NText tag="p">Made in India</NText>
          </NView>
        </NView>
      </NView>
    </NView>
  );
};

export default Footer;
