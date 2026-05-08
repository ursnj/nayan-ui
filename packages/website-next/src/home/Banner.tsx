'use client';

import { NButton, NCard } from '@nayan-ui/react';
import { ArrowRight, Code, Github, Monitor, Package, Palette, Rocket, Shield, Smartphone } from 'lucide-react';
import Link from 'next/link';

const Banner = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        {/* Hero Content */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
            <Package className="w-4 h-4" />
            Open Source Component Library
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">Nayan UI</h1>
          <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-8">
            An open source collection of beautifully crafted, accessible, and customizable UI components for React and React Native applications.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link href="/react/installation">
              <NButton className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-2.5 font-semibold w-full sm:w-auto">
                <Rocket className="w-4 h-4 mr-2" />
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </NButton>
            </Link>
            <a href="https://github.com/ursnj/nayan-ui" target="_blank" rel="noopener noreferrer">
              <NButton isOutline className="w-full sm:w-auto px-6 py-2.5 font-semibold">
                <Github className="w-4 h-4 mr-2" />
                View on GitHub
              </NButton>
            </a>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              MIT Licensed
            </span>
            <span className="flex items-center gap-1.5">
              <Code className="w-4 h-4" />
              TypeScript
            </span>
            <span className="flex items-center gap-1.5">
              <Palette className="w-4 h-4" />
              Themeable
            </span>
          </div>
        </div>

        {/* Platform Cards */}
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <Link href="/react/components">
            <NCard className="p-6 sm:p-8 hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <Monitor className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold group-hover:text-accent transition-colors">@nayan-ui/react</h3>
                  <p className="text-sm text-muted">For web applications</p>
                </div>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                50+ React components built on HeroUI and Tailwind CSS. Includes buttons, forms, modals, tables, navigation, and more.
              </p>
            </NCard>
          </Link>

          <Link href="/react-native/components">
            <NCard className="p-6 sm:p-8 hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold group-hover:text-accent transition-colors">@nayan-ui/react-native</h3>
                  <p className="text-sm text-muted">For mobile applications</p>
                </div>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                Native mobile components for iOS and Android, powered by HeroUI Native and Uniwind. Same familiar API as the web library.
              </p>
            </NCard>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Banner;
