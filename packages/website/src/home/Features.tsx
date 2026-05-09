'use client';

import { NCard } from '@nayan-ui/react';
import { BookOpenText, Code, Layers, Moon, Palette, PencilRuler, Shield, Smartphone, Zap } from 'lucide-react';

const Features = () => {
  const features = [
    {
      title: 'Cross-Platform',
      text: 'Separate packages for React web and React Native mobile, sharing a consistent API and design language.',
      icon: Smartphone,
      gradient: 'from-blue-500 to-cyan-500',
      shadow: 'shadow-blue-500/20',
      iconColor: 'text-white'
    },
    {
      title: 'TypeScript First',
      text: 'Written in TypeScript with full type definitions. Get autocompletion and type safety out of the box.',
      icon: Code,
      gradient: 'from-indigo-500 to-blue-500',
      shadow: 'shadow-indigo-500/20',
      iconColor: 'text-white'
    },
    {
      title: 'Accessible',
      text: 'Built on HeroUI with proper ARIA attributes, keyboard navigation, and screen reader support.',
      icon: Shield,
      gradient: 'from-emerald-500 to-teal-500',
      shadow: 'shadow-emerald-500/20',
      iconColor: 'text-white'
    },
    {
      title: 'Themeable',
      text: 'CSS variable based theming with light and dark mode. Customize colors, spacing, and typography to match your brand.',
      icon: Palette,
      gradient: 'from-purple-500 to-pink-500',
      shadow: 'shadow-purple-500/20',
      iconColor: 'text-white'
    },
    {
      title: 'Dark Mode',
      text: 'First-class dark mode support. Toggle themes with a single prop using the built-in NTheme provider.',
      icon: Moon,
      gradient: 'from-violet-500 to-purple-500',
      shadow: 'shadow-violet-500/20',
      iconColor: 'text-white'
    },
    {
      title: 'Customizable',
      text: 'Every component accepts className props for styling overrides. Works with Tailwind CSS utility classes.',
      icon: PencilRuler,
      gradient: 'from-orange-500 to-amber-500',
      shadow: 'shadow-orange-500/20',
      iconColor: 'text-white'
    },
    {
      title: 'Lightweight',
      text: 'Tree-shakable exports so you only ship the components you use. Minimal dependencies for fast load times.',
      icon: Zap,
      gradient: 'from-yellow-500 to-orange-500',
      shadow: 'shadow-yellow-500/20',
      iconColor: 'text-white'
    },
    {
      title: 'Well Documented',
      text: 'Interactive demos, prop tables, and code examples for every component. Copy-paste ready usage snippets.',
      icon: BookOpenText,
      gradient: 'from-teal-500 to-emerald-500',
      shadow: 'shadow-teal-500/20',
      iconColor: 'text-white'
    },
    {
      title: '50+ Components',
      text: 'Buttons, inputs, modals, tables, accordions, sheets, toasts, menus, popovers, sliders, and many more.',
      icon: Layers,
      gradient: 'from-rose-500 to-pink-500',
      shadow: 'shadow-rose-500/20',
      iconColor: 'text-white'
    }
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
            Why <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Nayan UI</span>?
          </h2>
          <p className="text-base sm:text-lg text-muted">
            Everything you need to build polished React and React Native apps — open source and free forever.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <NCard key={index} className="p-5 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center shrink-0 shadow-md ${feature.shadow}`}>
                  <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">{feature.title}</h4>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed">{feature.text}</p>
                </div>
              </div>
            </NCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
