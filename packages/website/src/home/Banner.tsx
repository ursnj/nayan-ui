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
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/8 via-purple-600/5 to-pink-600/8" />
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Text Content */}
          <div className="text-center lg:text-left space-y-6">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/15 to-purple-500/15 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium">
                <Package className="w-3.5 h-3.5" />
                Open Source
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                <Heart className="w-3.5 h-3.5" />
                Free Forever
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
              Build Beautiful
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                React & React Native
              </span>
              Components
            </h1>

            <p className="text-base sm:text-lg text-muted max-w-lg mx-auto lg:mx-0">
              A comprehensive component library with 50+ production-ready, accessible, and customizable UI components for web and mobile.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                50+ Components
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Code className="w-4 h-4 text-blue-500" />
                TypeScript
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Palette className="w-4 h-4 text-purple-500" />
                Themeable
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Shield className="w-4 h-4 text-emerald-500" />
                MIT Licensed
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/react/installation">
                <NButton className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 font-semibold w-full sm:w-auto shadow-lg shadow-blue-500/25">
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

          {/* Right — Browser Demo */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md lg:max-w-lg space-y-4">
              {/* Browser Window */}
              <NCard className="overflow-hidden shadow-2xl shadow-purple-500/10 border-0">
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
                          activeTab === index
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                            : 'text-muted hover:text-foreground'
                        }`}>
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Buttons Tab */}
                  {activeTab === 0 && (
                    <div className="space-y-3">
                      <NButton
                        onClick={handleButtonClick}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all">
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                          <Zap className="w-4 h-4 mr-2" />
                        )}
                        {isLoading ? 'Loading...' : 'Interactive Button'}
                      </NButton>
                      <div className="grid grid-cols-2 gap-2">
                        <NButton className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs">
                          <Check className="w-3 h-3 mr-1" />
                          Success
                        </NButton>
                        <NButton className="bg-rose-500 hover:bg-rose-600 text-white text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          Danger
                        </NButton>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-medium border border-blue-500/20">
                          Badge
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[10px] font-medium border border-purple-500/20">
                          Chip
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-medium border border-amber-500/20">
                          Tag
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                          Status
                        </span>
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
                          className="w-full pl-10 pr-4 py-2 bg-background border border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm">Enable notifications</span>
                      </div>
                      <select className="w-full px-3 py-2 bg-background border border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                        <option>Choose framework</option>
                        <option>React</option>
                        <option>React Native</option>
                      </select>
                      <div className="flex gap-2">
                        <div className="h-2 flex-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                        <div className="h-2 w-1/4 rounded-full bg-default" />
                      </div>
                    </div>
                  )}

                  {/* Cards Tab */}
                  {activeTab === 2 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between p-3 bg-background/60 rounded-lg border border-default/50">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-sm font-medium">Profile</span>
                        </div>
                        <Settings className="w-4 h-4 text-muted" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-background/60 rounded-lg border border-default/50">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                            <Bell className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-sm font-medium">Notifications</span>
                        </div>
                        <div className="w-8 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full relative">
                          <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-background/60 rounded-lg border border-default/50">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                            <Calendar className="w-3.5 h-3.5 text-white" />
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
              <NCard className="p-4 shadow-xl shadow-blue-500/5 border-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Component Library</span>
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-default/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted">Building amazing components...</div>
                </div>
              </NCard>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Code, label: 'TypeScript', gradient: 'from-blue-500 to-cyan-500' },
                  { icon: Palette, label: 'Theming', gradient: 'from-purple-500 to-pink-500' },
                  { icon: Zap, label: 'Fast', gradient: 'from-amber-500 to-orange-500' },
                  { icon: Shield, label: 'Accessible', gradient: 'from-emerald-500 to-teal-500' },
                  { icon: Smartphone, label: 'Cross-Platform', gradient: 'from-indigo-500 to-blue-500' }
                ].map(pill => (
                  <span
                    key={pill.label}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r ${pill.gradient} text-white text-xs font-medium shadow-sm`}>
                    <pill.icon className="w-3 h-3" />
                    {pill.label}
                  </span>
                ))}
              </div>

              {/* Floating Decorative Dots */}
              <div className="absolute -top-3 -right-3 w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full animate-bounce hidden lg:block" />
              <div className="absolute -bottom-3 -left-3 w-4 h-4 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full animate-ping hidden lg:block" />
              <div className="absolute top-1/2 -right-6 w-3 h-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full animate-pulse hidden lg:block" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
