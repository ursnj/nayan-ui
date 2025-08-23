import { useLocation } from 'react-router-dom';
import { NLink } from '@nayan-ui/react';
import { getMenuItem } from '@/services/Utils';
import Meta from '../helpers/Meta';
import Sidebar from '../helpers/Sidebar';

const DevtoolsMain = () => {
  const location = useLocation();
  const component: any = getMenuItem(location.pathname);

  return (
    <Sidebar title={component?.title || 'Devtools'}>
      <Meta
        title="Devtools - Command line tools for Nayan UI"
        description="Powerful command line tools for Nayan UI development including sitemap generation, robots.txt creation, and more developer utilities."
        keywords="sitemap generator, Sitemap validator, free sitemap generator, create XML sitemap, SEO sitemap tool, generate sitemap, XML sitemap, website SEO tool, robots.txt generator, robots.txt validator, meta tags generator, meta tags validator, favicon generator"
      />

      {/* Header Section */}
      <div className="bg-card border border-border rounded-lg mb-8">
        <div className="px-6 py-12">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mr-4">
                <span className="text-white font-bold text-2xl">CLI</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-text">Devtools</h1>
            </div>
            <p className="text-xl text-muted leading-relaxed mb-8">
              Powerful command line tools and developer utilities for building better web applications with Nayan UI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <NLink
                href="https://www.npmjs.com/package/@nayan-ui/cli"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z" />
                </svg>
                Install CLI
              </NLink>
              <NLink
                href="https://github.com/ursnj/nayan"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-border text-text rounded-lg hover:bg-border/50 transition-colors font-semibold">
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
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <NLink href="/devtools/sitemap" className="group">
          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text group-hover:text-primary transition-colors">Sitemap Generator</h3>
            </div>
            <p className="text-muted text-sm">Generate and validate XML sitemaps for better SEO optimization</p>
          </div>
        </NLink>

        <NLink href="/devtools/robots" className="group">
          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text group-hover:text-primary transition-colors">Robots.txt Generator</h3>
            </div>
            <p className="text-muted text-sm">Create and validate robots.txt files for search engine crawling control</p>
          </div>
        </NLink>
      </div>

      {/* Overview Content */}
      <div className="bg-card border border-border rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-text mb-6">Getting Started</h2>
        <div className="prose prose-gray max-w-none">
          <p className="text-muted mb-4">
            The Nayan UI CLI provides a comprehensive set of tools for web developers to enhance their development workflow and improve their
            website's SEO performance.
          </p>
          <div className="bg-background rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-text mb-2">Installation</h3>
            <pre className="bg-muted/20 rounded p-3 text-sm font-mono">
              <code>npm install -g @nayan-ui/cli</code>
            </pre>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-text mb-3">Quick Commands</h3>
              <div className="space-y-2">
                <div className="bg-muted/20 rounded p-2 text-sm font-mono">
                  <code>nayan create sitemap</code>
                </div>
                <div className="bg-muted/20 rounded p-2 text-sm font-mono">
                  <code>nayan create robots</code>
                </div>
                <div className="bg-muted/20 rounded p-2 text-sm font-mono">
                  <code>nayan validate sitemap</code>
                </div>
                <div className="bg-muted/20 rounded p-2 text-sm font-mono">
                  <code>nayan validate robots</code>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text mb-3">Framework Integration</h3>
              <p className="text-muted text-sm mb-3">
                Easily integrates into any framework with simple commands and works with all major search engines for seamless optimization.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">React</span>
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">Vue</span>
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">Angular</span>
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">Next.js</span>
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">Nuxt</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-card border border-border rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-text mb-6 flex items-center">
          <span className="mr-3">✨</span>
          Features
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="text-2xl mr-3">⌨️</span>
              <div>
                <h3 className="font-semibold text-text mb-1">Framework-Agnostic Integration</h3>
                <p className="text-muted text-sm">Easily integrates into any framework with simple commands.</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">🌈</span>
              <div>
                <h3 className="font-semibold text-text mb-1">Automatic Sitemap Generation</h3>
                <p className="text-muted text-sm">Creates sitemaps with domain-specific crawling.</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">🛡</span>
              <div>
                <h3 className="font-semibold text-text mb-1">Customizable Robots.txt Creation</h3>
                <p className="text-muted text-sm">Generate a fully customizable robots.txt file.</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">🌍</span>
              <div>
                <h3 className="font-semibold text-text mb-1">Image Asset Creation</h3>
                <p className="text-muted text-sm">Automatically create all the necessary image assets for your website.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="text-2xl mr-3">📦</span>
              <div>
                <h3 className="font-semibold text-text mb-1">SEO-Optimized Metadata Generation</h3>
                <p className="text-muted text-sm">Generate metadata to boost your website's SEO.</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">⚙️</span>
              <div>
                <h3 className="font-semibold text-text mb-1">Search Engine Integration</h3>
                <p className="text-muted text-sm">Works with all major search engines for seamless optimization.</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">🎨</span>
              <div>
                <h3 className="font-semibold text-text mb-1">SEO Resource Validation</h3>
                <p className="text-muted text-sm">Validate key SEO elements like sitemaps, robots.txt, metadata, and other assets.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default DevtoolsMain;
