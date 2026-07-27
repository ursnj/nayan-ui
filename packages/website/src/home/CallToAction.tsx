'use client';

import { NButton, NCard } from '@nayan-ui/react';
import { ArrowRight, Code, Github, Rocket, Smartphone, Sparkles, Star, Terminal, Users, Zap } from 'lucide-react';
import Link from 'next/link';

const CallToAction = () => {
  const platforms = [
    {
      title: 'React Development',
      description: 'Build modern web applications with 30+ React components powered by HeroUI and Tailwind CSS.',
      icon: Code,
      link: '/react/components'
    },
    {
      title: 'React Native Development',
      description: 'Create native mobile apps with 30+ React Native components powered by HeroUI Native.',
      icon: Smartphone,
      link: '/react-native/components'
    }
  ];

  const pills = [
    { icon: Zap, label: '50+ Components' },
    { icon: Star, label: 'TypeScript Support' },
    { icon: Users, label: 'React & React Native' },
    { icon: Sparkles, label: 'Production Ready' }
  ];

  return (
    <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-14 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium mb-5">
            <Rocket className="w-3.5 h-3.5" />
            Ready to Start
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
            Choose Your <span className="text-gradient">Platform</span>
          </h2>
          <p className="text-base sm:text-lg text-muted">
            Whether you're building for web or mobile, our component library provides everything you need to create beautiful, accessible, and
            performant applications.
          </p>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-12">
          {pills.map(pill => (
            <span
              key={pill.label}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium">
              <pill.icon className="w-3.5 h-3.5" />
              {pill.label}
            </span>
          ))}
        </div>

        {/* Platform Cards */}
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto mb-14">
          {platforms.map((platform, index) => (
            <NCard key={index} className="p-6 sm:p-8 text-center group hover:border-accent/40 hover:shadow-xl transition-all duration-300">
              <div className="space-y-5">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <platform.icon className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="text-xl font-bold mb-2">{platform.title}</h4>
                  <p className="text-sm text-muted leading-relaxed">{platform.description}</p>
                </div>

                <Link href={platform.link} className="block">
                  <NButton className="w-full py-2.5 font-semibold">
                    Explore Components
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </NButton>
                </Link>
              </div>
            </NCard>
          ))}
        </div>

        {/* Brand CTA Bar */}
        <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-8 sm:p-12 text-center shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <h3 className="text-2xl sm:text-3xl font-bold mb-3 text-white">Get Started in Minutes</h3>
            <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto mb-6">Install with a single command and start building immediately.</p>

            {/* Install Command */}
            <div className="max-w-sm mx-auto mb-6">
              <div className="flex items-center gap-3 bg-black/20 backdrop-blur-sm rounded-lg px-4 py-2.5 font-mono text-sm border border-white/10">
                <Terminal className="w-4 h-4 text-white/60 shrink-0" />
                <code className="text-white">npm install @nayan-ui/react</code>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/react/installation">
                <NButton className="bg-white hover:bg-white/90 text-accent px-6 py-2.5 font-semibold w-full sm:w-auto shadow-lg">
                  <Rocket className="w-4 h-4 mr-2" />
                  Read the Docs
                  <ArrowRight className="w-4 h-4 ml-2" />
                </NButton>
              </Link>
              <a href="https://github.com/ursnj/nayan-ui" target="_blank" rel="noopener noreferrer">
                <NButton className="bg-white/15 hover:bg-white/25 text-white border border-white/20 px-6 py-2.5 font-semibold w-full sm:w-auto backdrop-blur-sm">
                  <Github className="w-4 h-4 mr-2" />
                  Star on GitHub
                </NButton>
              </a>
            </div>
          </div>
        </div>

        {/* Final tagline */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted">Ready to elevate your development experience?</p>
          <p className="text-lg font-bold mt-1 text-gradient">Let's build something amazing together!</p>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
