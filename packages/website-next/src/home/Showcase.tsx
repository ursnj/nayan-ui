'use client';

import { NButton, NCard } from '@nayan-ui/react';
import { ArrowRight, Code, Eye, Shield, Smartphone, Star, Users } from 'lucide-react';
import Link from 'next/link';

const Showcase = () => {
  const stats = [
    { icon: Users, value: '50+', label: 'Components' },
    { icon: Shield, value: '100%', label: 'Accessible' },
    { icon: Star, value: 'Full', label: 'TypeScript' },
    { icon: Code, value: 'MIT', label: 'Licensed' }
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-background to-surface/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
            One Library,
            <span className="bg-gradient-to-r from-accent to-purple-600 bg-clip-text text-transparent"> Two Platforms</span>
          </h2>
          <p className="text-base sm:text-lg text-muted">Build consistent user experiences across web and mobile with a shared component API.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, index) => (
            <NCard key={index} className="p-5 text-center">
              <stat.icon className="w-5 h-5 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted mt-1">{stat.label}</div>
            </NCard>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link href="/react/components">
            <NButton className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-2.5 font-semibold w-full sm:w-auto">
              <Eye className="w-4 h-4 mr-2" />
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
        </div>
      </div>
    </section>
  );
};

export default Showcase;
