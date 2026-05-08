'use client';

import { NBadge, NCard, NDivider } from '@nayan-ui/react';
import { BookOpenText, Code, FerrisWheel, Globe, Monitor, PackageCheck, Palette, PencilRuler, Shield, Smartphone, Sparkles, Zap } from 'lucide-react';

const Features = () => {
  const features = [
    {
      title: 'Reusable Components',
      text: 'Pre-designed UI components — buttons, forms, modals, navigation menus, and more.',
      icon: FerrisWheel,
      category: 'Components'
    },
    {
      title: 'Customization',
      text: 'Customize appearance and behavior through props, theming, and CSS variables.',
      icon: PencilRuler,
      category: 'Styling'
    },
    {
      title: 'Design Consistency',
      text: 'Consistent design language across your entire application with shared tokens.',
      icon: PackageCheck,
      category: 'Design'
    },
    {
      title: 'Performance',
      text: 'Tree-shakable, lazy-loadable components with minimal bundle size impact.',
      icon: Zap,
      category: 'Performance'
    },
    {
      title: 'Documentation',
      text: 'Comprehensive docs with live examples, prop tables, and integration guides.',
      icon: BookOpenText,
      category: 'Developer'
    },
    {
      title: 'Community',
      text: 'Active open-source community with regular updates and responsive support.',
      icon: Globe,
      category: 'Support'
    }
  ];

  const highlights = [
    { icon: Smartphone, title: 'Cross-Platform', text: 'Same API for React and React Native' },
    { icon: Code, title: 'TypeScript First', text: 'Full type safety with IntelliSense' },
    { icon: Palette, title: 'Themeable', text: 'CSS variables with dark mode built-in' },
    { icon: Shield, title: 'Accessible', text: 'WCAG compliant with ARIA attributes' }
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16 max-w-2xl mx-auto">
          <NBadge color="accent" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1.5" />
            Features
          </NBadge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
            Everything You Need to
            <span className="block bg-gradient-to-r from-accent to-purple-600 bg-clip-text text-transparent">Build Amazing Apps</span>
          </h2>
          <p className="text-base sm:text-lg text-muted">
            Build once, deploy everywhere with components designed for modern React and React Native applications.
          </p>
        </div>

        {/* Highlights Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12 lg:mb-16">
          {highlights.map((item, index) => (
            <NCard key={index} className="p-4 sm:p-5 text-center">
              <item.icon className="w-6 h-6 text-accent mx-auto mb-3" />
              <h4 className="text-sm font-semibold mb-1">{item.title}</h4>
              <p className="text-xs text-muted">{item.text}</p>
            </NCard>
          ))}
        </div>

        <NDivider className="mb-12 lg:mb-16" />

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <NCard key={index} className="p-5 group hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 transition-colors shrink-0">
                  <feature.icon className="w-5 h-5 text-accent" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold group-hover:text-accent transition-colors">{feature.title}</h4>
                    <NBadge color="default" size="sm">
                      {feature.category}
                    </NBadge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed">{feature.text}</p>
                </div>
              </div>
            </NCard>
          ))}
        </div>

        {/* Platform Support */}
        <div className="mt-12 lg:mt-16">
          <NCard className="p-6 sm:p-8">
            <div className="grid sm:grid-cols-2 gap-8 items-center">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <Monitor className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">React Web</h4>
                  <p className="text-sm text-muted">Modern web applications with SSR support, built on HeroUI and Tailwind CSS.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">React Native</h4>
                  <p className="text-sm text-muted">Native mobile apps for iOS and Android, powered by HeroUI Native & Uniwind.</p>
                </div>
              </div>
            </div>
          </NCard>
        </div>
      </div>
    </section>
  );
};

export default Features;
