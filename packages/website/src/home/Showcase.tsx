'use client';

import { NButton, NCard } from '@nayan-ui/react';
import { ArrowRight, Code, Eye, Shield, Smartphone, Star, Users, Zap } from 'lucide-react';
import Link from 'next/link';

const Showcase = () => {
  const benefits = [
    {
      icon: Code,
      title: 'Developer Experience',
      description: 'TypeScript support, comprehensive documentation, and intuitive APIs.'
    },
    {
      icon: Smartphone,
      title: 'Cross-Platform',
      description: 'Same components work seamlessly across web and mobile platforms.'
    },
    {
      icon: Shield,
      title: 'Accessibility First',
      description: 'WCAG compliant with proper ARIA attributes and keyboard navigation.'
    },
    {
      icon: Zap,
      title: 'Performance Optimized',
      description: 'Tree-shakable, lightweight components optimized for production use.'
    }
  ];

  const stats = [
    { icon: Users, value: '50+', label: 'Components' },
    { icon: Shield, value: '100%', label: 'Accessible' },
    { icon: Star, value: 'TS', label: 'TypeScript' },
    { icon: Zap, value: 'Fast', label: 'Lightweight' }
  ];

  return (
    <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-brand-soft" />
      <div className="absolute top-1/4 right-1/3 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium mb-5">
            <Eye className="w-3.5 h-3.5" />
            Showcase
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
            Comprehensive <span className="text-gradient">Component Library</span>
          </h2>
          <p className="text-base sm:text-lg text-muted">
            Discover our extensive collection of components designed for modern React and React Native development. Crafted with performance,
            accessibility, and developer experience in mind.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto mb-14">
          {benefits.map((benefit, index) => (
            <NCard key={index} className="p-5 group hover:border-accent/40 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <benefit.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold mb-1 group-hover:text-accent transition-colors">{benefit.title}</h4>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            </NCard>
          ))}
        </div>

        {/* Platform Stats Card */}
        <div className="relative max-w-4xl mx-auto rounded-2xl bg-surface border border-default p-8 sm:p-10 mb-14 shadow-sm">
          <div className="relative text-center">
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-accent/10 text-accent rounded-lg flex items-center justify-center">
                  <Code className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm">React</span>
              </div>
              <span className="text-2xl text-muted/40 font-light">+</span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-accent/10 text-accent rounded-lg flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm">React Native</span>
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold mb-3">
              Two Libraries, <span className="text-gradient">One Design Language</span>
            </h3>
            <p className="text-sm text-muted max-w-xl mx-auto mb-8">
              Separate packages for React and React Native — each optimized for its platform, sharing a consistent API and design language.
            </p>

            <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
              {stats.map(stat => (
                <div key={stat.label} className="text-center">
                  <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center mx-auto mb-2">
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link href="/react/components">
            <NButton className="px-6 py-2.5 font-semibold w-full sm:w-auto">
              <Eye className="w-4 h-4 mr-2" />
              Explore React Components
              <ArrowRight className="w-4 h-4 ml-2" />
            </NButton>
          </Link>
          <Link href="/react-native/components">
            <NButton isOutline className="px-6 py-2.5 font-semibold w-full sm:w-auto">
              <Smartphone className="w-4 h-4 mr-2" />
              Explore React Native
            </NButton>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Showcase;
