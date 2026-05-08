'use client';

import { NButton } from '@nayan-ui/react';
import { ArrowRight, Github, Rocket, Terminal } from 'lucide-react';
import Link from 'next/link';

const CallToAction = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 sm:p-12 lg:p-16 text-center shadow-2xl shadow-purple-500/20">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight text-white">Get Started in Minutes</h2>
            <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto mb-8">
              Install Nayan UI and start building your next React or React Native application with production-ready components.
            </p>

            {/* Install Command */}
            <div className="max-w-md mx-auto mb-8">
              <div className="flex items-center gap-3 bg-black/20 backdrop-blur-sm rounded-lg px-4 py-3 font-mono text-sm border border-white/10">
                <Terminal className="w-4 h-4 text-white/60 shrink-0" />
                <code className="text-white">npm install @nayan-ui/react</code>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/react/installation">
                <NButton className="bg-white hover:bg-white/90 text-purple-700 px-6 py-2.5 font-semibold w-full sm:w-auto shadow-lg">
                  <Rocket className="w-4 h-4 mr-2" />
                  Read the Docs
                  <ArrowRight className="w-4 h-4 ml-2" />
                </NButton>
              </Link>
              <a href="https://github.com/ursnj/nayan-ui" target="_blank" rel="noopener noreferrer">
                <NButton className="bg-white/15 hover:bg-white/25 text-white border border-white/20 px-6 py-2.5 font-semibold w-full sm:w-auto backdrop-blur-sm">
                  <Github className="w-4 h-4 mr-2" />
                  View Source on GitHub
                </NButton>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
