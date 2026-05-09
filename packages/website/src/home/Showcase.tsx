'use client';

import { NButton, NCard } from '@nayan-ui/react';
import { ArrowRight, Code, Eye, Shield, Smartphone, Star, Users, Zap } from 'lucide-react';
import Link from 'next/link';

const Showcase = () => {
  const benefits = [
    {
      icon: Code,
      title: 'Developer Experience',
      description: 'TypeScript support, comprehensive documentation, and intuitive APIs.',
      gradient: 'from-blue-500 to-indigo-500',
      shadow: 'shadow-blue-500/20'
    },
    {
      icon: Smartphone,
      title: 'Cross-Platform',
      description: 'Same components work seamlessly across web and mobile platforms.',
      gradient: 'from-emerald-500 to-teal-500',
      shadow: 'shadow-emerald-500/20'
    },
    {
      icon: Shield,
      title: 'Accessibility First',
      description: 'WCAG compliant with proper ARIA attributes and keyboard navigation.',
      gradient: 'from-purple-500 to-violet-500',
      shadow: 'shadow-purple-500/20'
    },
    {
      icon: Zap,
      title: 'Performance Optimized',
      description: 'Tree-shakable, lightweight components optimized for production use.',
      gradient: 'from-amber-500 to-orange-500',
      shadow: 'shadow-amber-500/20'
    }
  ];

  return (
    <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 via-transparent to-blue-600/5" />
      <div className="absolute top-1/4 right-1/3 w-72 h-72 bg-blue-500/8 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/15 to-pink-500/15 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-medium mb-5">
            <Eye className="w-3.5 h-3.5" />
            Showcase
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
            Comprehensive <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Component Library</span>
          </h2>
          <p className="text-base sm:text-lg text-muted">
            Discover our extensive collection of components designed for modern React and React Native development. Crafted with performance,
            accessibility, and developer experience in mind.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto mb-14">
          {benefits.map((benefit, index) => (
            <NCard key={index} className="p-5 group hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div
                  className={`w-11 h-11 bg-gradient-to-br ${benefit.gradient} rounded-xl flex items-center justify-center shrink-0 shadow-lg ${benefit.shadow} group-hover:scale-110 transition-transform`}>
                  <benefit.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {benefit.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            </NCard>
          ))}
        </div>

        {/* Platform Stats Card */}
        <div className="relative max-w-4xl mx-auto rounded-2xl bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 border border-purple-500/15 p-8 sm:p-10 mb-14">
          <div className="absolute inset-0 rounded-2xl bg-surface/60 backdrop-blur-sm" />
          <div className="relative text-center">
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Code className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-sm">React</span>
              </div>
              <span className="text-2xl text-muted/40 font-light">+</span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-sm">React Native</span>
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold mb-3">
              Two Libraries, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">One Design Language</span>
            </h3>
            <p className="text-sm text-muted max-w-xl mx-auto mb-8">
              Separate packages for React and React Native — each optimized for its platform, sharing a consistent API and design language.
            </p>

            <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-blue-500/20">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold">50+</div>
                <div className="text-xs text-muted">Components</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/20">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold">100%</div>
                <div className="text-xs text-muted">Accessible</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-purple-500/20">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold">TS</div>
                <div className="text-xs text-muted">TypeScript</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-amber-500/20">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold">Fast</div>
                <div className="text-xs text-muted">Lightweight</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link href="/react/components">
            <NButton className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 font-semibold w-full sm:w-auto shadow-lg shadow-blue-500/20">
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
