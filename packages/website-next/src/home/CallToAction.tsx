'use client';

import { NButton, NCard } from '@nayan-ui/react';
import { ArrowRight, Github, Rocket, Terminal } from 'lucide-react';
import Link from 'next/link';

const CallToAction = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <NCard className="p-8 sm:p-12 lg:p-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Get Started in Minutes</h2>
          <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto mb-8">
            Install Nayan UI and start building your next React or React Native application with production-ready components.
          </p>

          {/* Install Command */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex items-center gap-3 bg-background rounded-lg px-4 py-3 font-mono text-sm">
              <Terminal className="w-4 h-4 text-muted shrink-0" />
              <code className="text-foreground">npm install @nayan-ui/react</code>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/react/installation">
              <NButton className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-2.5 font-semibold w-full sm:w-auto">
                <Rocket className="w-4 h-4 mr-2" />
                Read the Docs
                <ArrowRight className="w-4 h-4 ml-2" />
              </NButton>
            </Link>
            <a href="https://github.com/ursnj/nayan-ui" target="_blank" rel="noopener noreferrer">
              <NButton isOutline className="px-6 py-2.5 font-semibold w-full sm:w-auto">
                <Github className="w-4 h-4 mr-2" />
                View Source on GitHub
              </NButton>
            </a>
          </div>
        </NCard>
      </div>
    </section>
  );
};

export default CallToAction;
