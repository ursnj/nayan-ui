"use client";

import {
  ArrowRight,
  Bot,
  Bug,
  Github,
  Keyboard,
  Map as MapIcon,
  Package,
  Rocket,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DocsIntro } from "@/design/Primitives";
import { ACCENT_SOFT, BUTTON_SMALL, CARD, CARD_INTERACTIVE, GRID_GAP, H3 } from "@/design/system";
import Code from "@/helpers/Code";
import Sidebar from "@/helpers/Sidebar";
import SubHeader from "@/helpers/SubHeader";
import { getMenuItem } from "@/services/Utils";

const TOOLS = [
  {
    icon: MapIcon,
    title: "Sitemap generator",
    body: "Crawl a site to generate an XML sitemap, or validate one you already have.",
    href: "/devtools/sitemap",
  },
  {
    icon: Bot,
    title: "Robots.txt generator",
    body: "Build and validate robots.txt files, with per-path crawler rules.",
    href: "/devtools/robots",
  },
  {
    icon: Sparkles,
    title: "AI code reviewer",
    body: "Review a GitHub pull request with Codex or Claude Code, inline or as a summary.",
    href: "/devtools/ai-code-reviewer",
  },
  {
    icon: ShieldCheck,
    title: "AI code scanner",
    body: "Scan a repository for vulnerable packages and open a pull request that fixes them.",
    href: "/devtools/ai-code-scanner",
  },
];

const PACKAGES = [
  {
    name: "@nayan-ui/cli",
    lead: "Scaffold new projects from templates, generate XML sitemaps by crawling a site, and create or validate robots.txt files.",
    install:
      "npm install -g @nayan-ui/cli\n\n# or, without installing\nnpx @nayan-ui/cli [command]",
    commands: `nayan-ui new
nayan-ui new my-app -t expo
nayan-ui create sitemap -w https://example.com
nayan-ui create robots -d /admin
nayan-ui validate sitemap -i ./sitemap.xml
nayan-ui validate robots -i ./robots.txt`,
    features: [
      {
        icon: Rocket,
        title: "Project scaffolding",
        body: "Create projects from the Expo, Games, Next.js and Vite templates.",
      },
      {
        icon: MapIcon,
        title: "Sitemaps",
        body: "Crawl a website to generate an XML sitemap, or validate an existing one.",
      },
      {
        icon: Bot,
        title: "Robots.txt",
        body: "Create and validate robots.txt files for crawler control.",
      },
      {
        icon: Keyboard,
        title: "Interactive or not",
        body: "Prompts when you want them, flags when you are scripting CI.",
      },
    ],
  },
  {
    name: "@nayan-ui/ai",
    lead: "Codex and Claude Code agents that review GitHub pull requests and scan repositories for vulnerable dependencies, with auto-fix.",
    install: "npm install -g @nayan-ui/ai\n\n# or, without installing\nnpx @nayan-ui/ai [command]",
    commands: `nayan-ai review <pr-url> -t ghp_xxx
nayan-ai review <pr-url> -t ghp_xxx --dry
nayan-ai review <pr-url> -t ghp_xxx --inline
nayan-ai scan <repo-url> -t ghp_xxx
nayan-ai scan <repo-url> -t ghp_xxx --fix
nayan-ai scan <repo-url> -t ghp_xxx --llm claude`,
    features: [
      {
        icon: Bug,
        title: "AI code review",
        body: "Deep pull-request analysis for bugs, security, performance and test coverage.",
      },
      {
        icon: ShieldCheck,
        title: "Vulnerability scanning",
        body: "Package vulnerabilities across npm, Python, Go, Rust and more.",
      },
      {
        icon: Wrench,
        title: "Auto-fix and PRs",
        body: "Fix what it finds and open a pull request describing the change.",
      },
      {
        icon: Bot,
        title: "Two providers",
        body: "Codex by default, or Claude Code with one flag.",
      },
    ],
  },
];

const DevtoolsMain = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Devtools"}>
      <DocsIntro
        lead="Two command line packages and four browser tools: project scaffolding, sitemap and robots.txt generation, AI pull-request review and dependency scanning. All of them free, and the browser ones run without an account."
        actions={
          <>
            <Link
              href="https://www.npmjs.com/package/@nayan-ui/cli"
              target="_blank"
              rel="noopener noreferrer"
              className={BUTTON_SMALL}
            >
              <Package aria-hidden className="mr-2 h-4 w-4" />
              @nayan-ui/cli
            </Link>
            <Link
              href="https://www.npmjs.com/package/@nayan-ui/ai"
              target="_blank"
              rel="noopener noreferrer"
              className={BUTTON_SMALL}
            >
              <Package aria-hidden className="mr-2 h-4 w-4" />
              @nayan-ui/ai
            </Link>
            <Link
              href="https://github.com/ursnj/nayan-ui"
              target="_blank"
              rel="noopener noreferrer"
              className={BUTTON_SMALL}
            >
              <Github aria-hidden className="mr-2 h-4 w-4" />
              View source
            </Link>
          </>
        }
      />

      <SubHeader title="Browser tools" description="No install, no account — they run in the page.">
        <div className={`grid sm:grid-cols-2 ${GRID_GAP}`}>
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.href} href={tool.href} className={`${CARD_INTERACTIVE} group p-5`}>
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${ACCENT_SOFT}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className={H3}>{tool.title}</h3>
                  <ArrowRight
                    aria-hidden
                    className="ml-auto h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
                  />
                </div>
                <p className="text-sm leading-relaxed text-muted">{tool.body}</p>
              </Link>
            );
          })}
        </div>
      </SubHeader>

      {PACKAGES.map((pkg) => (
        <SubHeader key={pkg.name} title={pkg.name} description={pkg.lead}>
          <div className="grid min-w-0 gap-5 lg:grid-cols-2">
            <div className="min-w-0 space-y-4">
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  Install
                </h4>
                <Code code={pkg.install} language="bash" filename="terminal" />
              </div>
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  Commands
                </h4>
                <Code code={pkg.commands} language="bash" filename="terminal" />
              </div>
            </div>

            <div className={`${CARD} p-5`}>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">
                What it does
              </h4>
              <ul className="space-y-4">
                {pkg.features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <li key={feature.title} className="flex items-start gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${ACCENT_SOFT}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-foreground">
                          {feature.title}
                        </span>
                        <span className="mt-0.5 block text-sm leading-relaxed text-muted">
                          {feature.body}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </SubHeader>
      ))}
    </Sidebar>
  );
};

export default DevtoolsMain;
