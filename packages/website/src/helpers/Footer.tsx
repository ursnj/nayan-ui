import { NDivider, NLink } from '@nayan-ui/react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="container mx-auto px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img src="/logo.webp" fetchPriority="high" alt="Nayan UI Logo" className="w-10 h-10" loading="lazy" />
              <span className="text-xl font-bold text-text">Nayan UI</span>
            </div>
            <p className="text-muted text-sm leading-relaxed">
              Beautiful, accessible, and customizable React & React Native components built with modern design principles.
            </p>
            <div className="flex space-x-4">
              <NLink
                href="https://github.com/ursnj/nayan-ui"
                className="text-muted hover:text-primary transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </NLink>
              <NLink
                href="https://www.npmjs.com/package/@nayan-ui/react"
                className="text-muted hover:text-primary transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z" />
                </svg>
              </NLink>
            </div>
          </div>

          {/* Documentation Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text">Documentation</h3>
            <div className="space-y-2">
              <NLink href="/react/installation" className="block text-muted hover:text-primary transition-colors duration-200 text-sm">
                React Installation
              </NLink>
              <NLink href="/react-native/installation" className="block text-muted hover:text-primary transition-colors duration-200 text-sm">
                React Native Installation
              </NLink>
              <NLink href="/react/components" className="block text-muted hover:text-primary transition-colors duration-200 text-sm">
                React Components
              </NLink>
              <NLink href="/react-native/components" className="block text-muted hover:text-primary transition-colors duration-200 text-sm">
                React Native Components
              </NLink>
            </div>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text">Resources</h3>
            <div className="space-y-2">
              <NLink href="/contributions" className="block text-muted hover:text-primary transition-colors duration-200 text-sm">
                Contributing
              </NLink>
              <NLink href="/tags" className="block text-muted hover:text-primary transition-colors duration-200 text-sm">
                Component Tags
              </NLink>
              <NLink
                href="https://github.com/ursnj/nayan-ui/issues"
                className="block text-muted hover:text-primary transition-colors duration-200 text-sm"
                target="_blank"
                rel="noopener noreferrer">
                Report Issues
              </NLink>
              <NLink
                href="https://github.com/ursnj/nayan-ui/discussions"
                className="block text-muted hover:text-primary transition-colors duration-200 text-sm"
                target="_blank"
                rel="noopener noreferrer">
                Discussions
              </NLink>
            </div>
          </div>

          {/* Community */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text">Community</h3>
            <div className="space-y-2">
              <NLink
                href="https://github.com/ursnj/nayan-ui"
                className="block text-muted hover:text-primary transition-colors duration-200 text-sm"
                target="_blank"
                rel="noopener noreferrer">
                GitHub Repository
              </NLink>
              <NLink
                href="https://www.npmjs.com/package/@nayan-ui/cli"
                className="block text-muted hover:text-primary transition-colors duration-200 text-sm"
                target="_blank"
                rel="noopener noreferrer">
                NPM Package (Cli)
              </NLink>
              <NLink
                href="https://www.npmjs.com/package/@nayan-ui/react"
                className="block text-muted hover:text-primary transition-colors duration-200 text-sm"
                target="_blank"
                rel="noopener noreferrer">
                NPM Package (React)
              </NLink>
              <NLink
                href="https://www.npmjs.com/package/@nayan-ui/react-native"
                className="block text-muted hover:text-primary transition-colors duration-200 text-sm"
                target="_blank"
                rel="noopener noreferrer">
                NPM Package (React Native)
              </NLink>
            </div>
          </div>
        </div>

        <NDivider className="my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
            <div className="text-sm text-muted">© {currentYear} Nayan UI. All rights reserved.</div>
            <div className="flex items-center space-x-4 text-sm text-muted">
              <NLink
                href="https://github.com/ursnj/nayan-ui/blob/main/LICENSE"
                className="hover:text-primary transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer">
                MIT License
              </NLink>
              <span>•</span>
              <NLink
                href="https://github.com/ursnj/nayan-ui/releases"
                className="hover:text-primary transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer">
                Changelog
              </NLink>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted">
            <span>Made with</span>
            <span className="text-red-500 animate-pulse">❤️</span>
            <span>in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
