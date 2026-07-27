'use client';

import { useEffect, useState } from 'react';
import { NButton, NCard } from '@nayan-ui/react';
import {
  ArrowRight,
  Bell,
  Calendar,
  Check,
  Code,
  Github,
  Heart,
  Package,
  Palette,
  Rocket,
  Search,
  Settings,
  Shield,
  Smartphone,
  Star,
  User,
  Zap
} from 'lucide-react';
import Link from 'next/link';

const Banner = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [progress, setProgress] = useState(65);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 10;
        return next > 100 ? 20 : next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleButtonClick = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <section className="relative overflow-hidden">
      {/* Subtle accent background */}
      <div className="absolute inset-0 bg-brand-soft" />
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Text Content */}
          <div className="text-center lg:text-left space-y-6">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium">
                <Package className="w-3.5 h-3.5" />
                Open Source
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/20 text-success text-xs font-medium">
                <Heart className="w-3.5 h-3.5" />
                Free Forever
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
              Build Beautiful
              <span className="block text-gradient">React & React Native</span>
              Components
            </h1>

            <p className="text-base sm:text-lg text-muted max-w-lg mx-auto lg:mx-0">
              A comprehensive component library with 50+ production-ready, accessible, and customizable UI components for web and mobile.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                <Star className="w-4 h-4 text-accent" />
                50+ Components
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Code className="w-4 h-4 text-accent" />
                TypeScript
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Palette className="w-4 h-4 text-accent" />
                Themeable
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Shield className="w-4 h-4 text-accent" />
                MIT Licensed
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/react/installation">
                <NButton className="px-6 py-2.5 font-semibold w-full sm:w-auto">
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
          </div>

          {/* Right — Browser Demo (intentionally colorful: it showcases the components) */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md lg:max-w-lg space-y-4">
              {/* Browser Window */}
              <NCard className="overflow-hidden shadow-2xl border-0">
                {/* Chrome Bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-surface-secondary border-b border-default">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 mx-3">
                    <div className="bg-background rounded-md px-3 py-1 text-xs text-muted text-center truncate">nayanui.com/react/components</div>
                  </div>
                </div>

                {/* Demo Content */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Tab Navigation */}
                  <div className="flex gap-1 bg-background/60 rounded-lg p-1">
                    {['Buttons', 'Forms', 'Cards'].map((tab, index) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(index)}
                        className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          activeTab === index ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted hover:text-foreground'
                        }`}>
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Buttons Tab */}
                  {activeTab === 0 && (
                    <div className="space-y-3">
                      <NButton onClick={handleButtonClick} className="w-full">
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                          <Zap className="w-4 h-4 mr-2" />
                        )}
                        {isLoading ? 'Loading...' : 'Interactive Button'}
                      </NButton>
                      <div className="grid grid-cols-2 gap-2">
                        <NButton className="bg-success hover:bg-success/90 text-success-foreground text-xs">
                          <Check className="w-3 h-3 mr-1" />
                          Success
                        </NButton>
                        <NButton className="bg-danger hover:bg-danger/90 text-danger-foreground text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          Danger
                        </NButton>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-medium border border-accent/20">Badge</span>
                        <span className="px-2 py-0.5 rounded-full bg-success/15 text-success text-[10px] font-medium border border-success/20">Chip</span>
                        <span className="px-2 py-0.5 rounded-full bg-warning/15 text-warning text-[10px] font-medium border border-warning/20">Tag</span>
                        <span className="px-2 py-0.5 rounded-full bg-danger/15 text-danger text-[10px] font-medium border border-danger/20">Status</span>
                      </div>
                    </div>
                  )}

                  {/* Forms Tab */}
                  {activeTab === 1 && (
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                          type="text"
                          placeholder="Search components..."
                          className="w-full pl-10 pr-4 py-2 bg-background border border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-2 border-accent bg-accent flex items-center justify-center">
                          <Check className="w-3 h-3 text-accent-foreground" />
                        </div>
                        <span className="text-sm">Enable notifications</span>
                      </div>
                      <select className="w-full px-3 py-2 bg-background border border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50">
                        <option>Choose framework</option>
                        <option>React</option>
                        <option>React Native</option>
                      </select>
                      <div className="flex gap-2">
                        <div className="h-2 flex-1 rounded-full bg-accent" />
                        <div className="h-2 w-1/4 rounded-full bg-default" />
                      </div>
                    </div>
                  )}

                  {/* Cards Tab */}
                  {activeTab === 2 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between p-3 bg-background/60 rounded-lg border border-default/50">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-sm font-medium">Profile</span>
                        </div>
                        <Settings className="w-4 h-4 text-muted" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-background/60 rounded-lg border border-default/50">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-warning/10 text-warning flex items-center justify-center">
                            <Bell className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-sm font-medium">Notifications</span>
                        </div>
                        <div className="w-8 h-4 bg-accent rounded-full relative">
                          <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-background/60 rounded-lg border border-default/50">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-success/10 text-success flex items-center justify-center">
                            <Calendar className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-sm font-medium">Schedule</span>
                        </div>
                        <span className="text-xs text-muted">Today</span>
                      </div>
                    </div>
                  )}
                </div>
              </NCard>

              {/* Progress Card */}
              <NCard className="p-4 shadow-xl border-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Component Library</span>
                    <span className="text-xs font-medium text-accent">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-default/50 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-gradient rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="text-xs text-muted">Building amazing components...</div>
                </div>
              </NCard>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Code, label: 'TypeScript' },
                  { icon: Palette, label: 'Theming' },
                  { icon: Zap, label: 'Fast' },
                  { icon: Shield, label: 'Accessible' },
                  { icon: Smartphone, label: 'Cross-Platform' }
                ].map(pill => (
                  <span
                    key={pill.label}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium">
                    <pill.icon className="w-3 h-3" />
                    {pill.label}
                  </span>
                ))}
              </div>

              {/* Floating Decorative Dots */}
              <div className="absolute -top-3 -right-3 w-6 h-6 bg-accent/80 rounded-full hidden lg:block" />
              <div className="absolute -bottom-3 -left-3 w-4 h-4 bg-accent/40 rounded-full hidden lg:block" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
