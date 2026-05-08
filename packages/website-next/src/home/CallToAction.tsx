'use client';

import { useState } from 'react';
import { NButton, NCard, NDivider, NInput } from '@nayan-ui/react';
import { ArrowRight, Code, Github, Rocket, Smartphone, Sparkles } from 'lucide-react';
import Link from 'next/link';

const CallToAction = () => {
  const [email, setEmail] = useState('');

  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main CTA */}
        <NCard className="p-8 sm:p-12 lg:p-16 text-center">
          <Rocket className="w-10 h-10 text-accent mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Ready to Get Started?</h2>
          <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto mb-8">
            Choose your platform and start building beautiful, accessible applications today.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
            <Link href="/react/components">
              <NButton className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-2.5 font-semibold w-full sm:w-auto">
                <Code className="w-4 h-4 mr-2" />
                React Components
                <ArrowRight className="w-4 h-4 ml-2" />
              </NButton>
            </Link>
            <Link href="/react-native/components">
              <NButton isOutline className="px-6 py-2.5 font-semibold w-full sm:w-auto">
                <Smartphone className="w-4 h-4 mr-2" />
                React Native Components
              </NButton>
            </Link>
            <a href="https://github.com/ursnj/nayan-ui" target="_blank" rel="noopener noreferrer">
              <NButton isOutline className="px-6 py-2.5 font-semibold w-full sm:w-auto">
                <Github className="w-4 h-4 mr-2" />
                Star on GitHub
              </NButton>
            </a>
          </div>

          <NDivider className="my-8" />

          {/* Newsletter */}
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold">Stay Updated</span>
            </div>
            <p className="text-sm text-muted mb-4">Get notified about new components, updates, and best practices.</p>
            <div className="flex gap-2">
              <NInput
                wrapperClassName="mb-0 flex-1"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <NButton className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 shrink-0">Subscribe</NButton>
            </div>
            <p className="text-xs text-muted mt-3">No spam. Unsubscribe anytime.</p>
          </div>
        </NCard>
      </div>
    </section>
  );
};

export default CallToAction;
