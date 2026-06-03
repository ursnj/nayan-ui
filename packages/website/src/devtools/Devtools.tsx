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
              Powerful command line tools and developer utilities for building better web applications with Nayan UI.
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
      </div>

      {/* Overview Content */}
      <div className="bg-surface border border-default rounded-xl p-4 sm:p-6 lg:p-8 mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
          <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Getting Started</span>
        </h2>
        <div className="prose prose-gray max-w-none">
          <p className="text-muted mb-4">
            The Nayan UI CLI lets you scaffold new projects from templates, generate XML sitemaps by crawling your website, and create or validate
            robots.txt files.
          </p>
          <div className="bg-background rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">Installation</h3>
            <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto">
              <code>npm install -g @nayan-ui/cli</code>
            </pre>
            <p className="text-muted text-sm mt-2">Or use directly with npx (no install required):</p>
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
              <h3 className="text-lg font-semibold text-foreground mb-3">Available Templates</h3>
              <p className="text-muted text-sm mb-3">
                Create new projects instantly with <code className="text-foreground">nayan-ui new</code>. Choose from these templates:
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-500/12 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                  Expo
                </span>
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  Games
                </span>
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-500/12 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                  Next.js
                </span>
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-cyan-500/12 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                  Vite
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-surface border border-default rounded-xl p-4 sm:p-6 lg:p-8 mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">✨ Features</span>
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="text-2xl mr-3">🚀</span>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Project Scaffolding</h3>
                <p className="text-muted text-sm">Create new projects from Expo, Games, Next.js, and Vite templates with a single command.</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">🗺️</span>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Sitemap Generation</h3>
                <p className="text-muted text-sm">Crawl your website and generate XML sitemaps with configurable depth and change frequency.</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">🤖</span>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Robots.txt Generation</h3>
                <p className="text-muted text-sm">Generate robots.txt files with allowed/disallowed paths and sitemap references.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Sitemap Validation</h3>
                <p className="text-muted text-sm">Validate local or remote sitemaps for correct XML structure, URLs, and priority values.</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">🛡</span>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Robots.txt Validation</h3>
                <p className="text-muted text-sm">Validate local or remote robots.txt files for required directives like User-agent and Sitemap.</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">⌨️</span>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Interactive & Non-Interactive</h3>
                <p className="text-muted text-sm">Use interactive prompts or pass flags directly for CI/CD automation.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default DevtoolsMain;
