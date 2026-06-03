'use client';

import { NLink } from '@nayan-ui/react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/helpers/Sidebar';
import { getMenuItem } from '@/services/Utils';

const DevtoolsMain = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || 'Devtools'}>
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-cyan-600/10 border border-blue-500/15 mb-8">
        <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm rounded-2xl" />
        <div className="relative px-4 sm:px-6 py-8 sm:py-12">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg shadow-blue-500/20">
                <span className="text-white font-bold text-2xl">CLI</span>
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">Devtools</span>
              </h1>
            </div>
            <p className="text-base sm:text-xl text-muted leading-relaxed mb-6 sm:mb-8">
              Powerful command line tools, AI-powered code review, and developer utilities for building better web applications with Nayan UI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <NLink
                href="https://www.npmjs.com/package/@nayan-ui/cli"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all font-semibold shadow-md shadow-blue-500/20">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z" />
                </svg>
                Install CLI
              </NLink>
              <NLink
                href="https://www.npmjs.com/package/@nayan-ui/ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-lg hover:from-amber-600 hover:to-rose-600 transition-all font-semibold shadow-md shadow-amber-500/20">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z" />
                </svg>
                Install AI
              </NLink>
              <NLink
                href="https://github.com/ursnj/nayan-ui"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-default text-foreground rounded-lg hover:bg-default/50 transition-colors font-semibold">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                View Source
              </NLink>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <NLink href="/devtools/sitemap" className="group">
          <div className="bg-surface border border-default rounded-xl p-6 hover:border-emerald-500/30 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mr-4 shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Sitemap Generator
              </h3>
            </div>
            <p className="text-muted text-sm">Generate and validate XML sitemaps for better SEO optimization</p>
          </div>
        </NLink>

        <NLink href="/devtools/robots" className="group">
          <div className="bg-surface border border-default rounded-xl p-6 hover:border-purple-500/30 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mr-4 shadow-md shadow-purple-500/20 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Robots.txt Generator
              </h3>
            </div>
            <p className="text-muted text-sm">Create and validate robots.txt files for search engine crawling control</p>
          </div>
        </NLink>

        <NLink href="/devtools/ai-code-reviewer" className="group">
          <div className="bg-surface border border-default rounded-xl p-6 hover:border-amber-500/30 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mr-4 shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                AI Code Reviewer
              </h3>
            </div>
            <p className="text-muted text-sm">AI-powered GitHub PR review using Codex & Claude Code</p>
          </div>
        </NLink>

        <NLink href="/devtools/ai-code-scanner" className="group">
          <div className="bg-surface border border-default rounded-xl p-6 hover:border-rose-500/30 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-red-500 rounded-xl flex items-center justify-center mr-4 shadow-md shadow-rose-500/20 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                AI Code Scanner
              </h3>
            </div>
            <p className="text-muted text-sm">Scan repositories for package vulnerabilities with auto-fix PR creation</p>
          </div>
        </NLink>
      </div>

      {/* @nayan-ui/cli Section */}
      <div className="bg-surface border border-default rounded-xl p-4 sm:p-6 lg:p-8 mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
          <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">@nayan-ui/cli</span>
        </h2>
        <p className="text-muted mb-4">
          Scaffold new projects from templates, generate XML sitemaps by crawling your website, and create or validate robots.txt files.
        </p>
        <div className="bg-background rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">Installation</h3>
          <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto">
            <code>npm install -g @nayan-ui/cli</code>
          </pre>
          <p className="text-muted text-sm mt-2">Or use directly with npx:</p>
          <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto mt-2">
            <code>npx @nayan-ui/cli [command]</code>
          </pre>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Quick Commands</h3>
            <div className="space-y-2">
              <div className="bg-muted/20 rounded p-2 text-sm font-mono">
                <code>nayan-ui new</code>
              </div>
              <div className="bg-muted/20 rounded p-2 text-sm font-mono">
                <code>nayan-ui new my-app -t expo</code>
              </div>
              <div className="bg-muted/20 rounded p-2 text-sm font-mono">
                <code>nayan-ui create sitemap -w https://example.com</code>
              </div>
              <div className="bg-muted/20 rounded p-2 text-sm font-mono">
                <code>nayan-ui create robots -d /admin</code>
              </div>
              <div className="bg-muted/20 rounded p-2 text-sm font-mono">
                <code>nayan-ui validate sitemap -i ./sitemap.xml</code>
              </div>
              <div className="bg-muted/20 rounded p-2 text-sm font-mono">
                <code>nayan-ui validate robots -i ./robots.txt</code>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Features</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="text-lg mr-2">🚀</span>
                <div>
                  <h4 className="font-semibold text-sm">Project Scaffolding</h4>
                  <p className="text-muted text-xs">Create projects from Expo, Games, Next.js, and Vite templates.</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-lg mr-2">🗺️</span>
                <div>
                  <h4 className="font-semibold text-sm">Sitemap Generation & Validation</h4>
                  <p className="text-muted text-xs">Crawl websites to generate XML sitemaps, or validate existing ones.</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-lg mr-2">🤖</span>
                <div>
                  <h4 className="font-semibold text-sm">Robots.txt Generation & Validation</h4>
                  <p className="text-muted text-xs">Create and validate robots.txt files for crawler control.</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-lg mr-2">⌨️</span>
                <div>
                  <h4 className="font-semibold text-sm">Interactive & Non-Interactive</h4>
                  <p className="text-muted text-xs">Use interactive prompts or pass flags for CI/CD automation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* @nayan-ui/ai Section */}
      <div className="bg-surface border border-default rounded-xl p-4 sm:p-6 lg:p-8 mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
          <span className="bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">@nayan-ui/ai</span>
        </h2>
        <p className="text-muted mb-4">
          AI-powered developer tools that use Codex or Claude Code agents to review GitHub Pull Requests and scan repositories for security
          vulnerabilities with auto-fix capabilities.
        </p>
        <div className="bg-background rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">Installation</h3>
          <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto">
            <code>npm install -g @nayan-ui/ai</code>
          </pre>
          <p className="text-muted text-sm mt-2">Or use directly with npx:</p>
          <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto mt-2">
            <code>npx @nayan-ui/ai [command]</code>
          </pre>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Quick Commands</h3>
            <div className="space-y-2">
              <div className="bg-muted/20 rounded p-2 text-sm font-mono">
                <code>nayan-ai review {'<pr-url>'} -t ghp_xxx</code>
              </div>
              <div className="bg-muted/20 rounded p-2 text-sm font-mono">
                <code>nayan-ai review {'<pr-url>'} -t ghp_xxx --dry</code>
              </div>
              <div className="bg-muted/20 rounded p-2 text-sm font-mono">
                <code>nayan-ai review {'<pr-url>'} -t ghp_xxx --inline</code>
              </div>
              <div className="bg-muted/20 rounded p-2 text-sm font-mono">
                <code>nayan-ai scan {'<repo-url>'} -t ghp_xxx</code>
              </div>
              <div className="bg-muted/20 rounded p-2 text-sm font-mono">
                <code>nayan-ai scan {'<repo-url>'} -t ghp_xxx --fix</code>
              </div>
              <div className="bg-muted/20 rounded p-2 text-sm font-mono">
                <code>nayan-ai scan {'<repo-url>'} -t ghp_xxx --llm claude</code>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Features</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="text-lg mr-2">🐛</span>
                <div>
                  <h4 className="font-semibold text-sm">AI Code Review</h4>
                  <p className="text-muted text-xs">Deep PR analysis for bugs, security issues, performance, and test coverage.</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-lg mr-2">🛡️</span>
                <div>
                  <h4 className="font-semibold text-sm">Vulnerability Scanning</h4>
                  <p className="text-muted text-xs">Scan repos for package vulnerabilities across npm, Python, Go, Rust, and more.</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-lg mr-2">🔧</span>
                <div>
                  <h4 className="font-semibold text-sm">Auto-Fix & PR Creation</h4>
                  <p className="text-muted text-xs">Automatically fix vulnerabilities and create PRs with detailed descriptions.</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-lg mr-2">🤖</span>
                <div>
                  <h4 className="font-semibold text-sm">Codex & Claude Code</h4>
                  <p className="text-muted text-xs">Choose between Codex (default) or Claude Code as the AI provider.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default DevtoolsMain;
