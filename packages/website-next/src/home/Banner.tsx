'use client';

import { useState } from 'react';
import { NBadge, NButton, NCard, NChip, NDivider, NInput, NProgress, NSelect } from '@nayan-ui/react';
import { ArrowRight, Code, Github, Heart, Palette, Rocket, Shield, Sparkles, Star, Users, Zap } from 'lucide-react';
import Link from 'next/link';

const Banner = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <NBadge color="accent">
                <Sparkles className="w-3 h-3 mr-1.5" />
                v2.0 Released
              </NBadge>
              <NBadge color="success">
                <Heart className="w-3 h-3 mr-1.5" />
                Open Source
              </NBadge>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight">
                Build Beautiful
                <span className="block bg-gradient-to-r from-accent to-purple-600 bg-clip-text text-transparent">React & React Native</span>
                Components
              </h1>
              <p className="text-base sm:text-lg text-muted max-w-xl mx-auto lg:mx-0">
                A production-ready component library for web and mobile. Ship faster with 50+ accessible, customizable components.
              </p>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-6 text-sm">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">50+ Components</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="font-medium">TypeScript</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-purple-500" />
                <span className="font-medium">Themeable</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/react/components">
                <NButton className="group bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-2.5 font-semibold w-full sm:w-auto">
                  <Rocket className="w-4 h-4 mr-2" />
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </NButton>
              </Link>
              <Link href="/react-native/components">
                <NButton isOutline className="w-full sm:w-auto px-6 py-2.5 font-semibold">
                  <Code className="w-4 h-4 mr-2" />
                  View Components
                </NButton>
              </Link>
            </div>

            <a
              href="https://github.com/ursnj/nayan-ui"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors">
              <Github className="w-4 h-4" />
              Star us on GitHub
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          {/* Right Content - Interactive Demo */}
          <div className="hidden lg:block">
            <NCard className="p-6 shadow-xl">
              <div className="space-y-5">
                {/* Window Chrome */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <span className="text-xs text-muted font-mono">preview.tsx</span>
                </div>

                <NDivider />

                {/* Tab Navigation */}
                <div className="flex gap-1 bg-background rounded-lg p-1">
                  {['Buttons', 'Forms', 'Cards'].map((tab, index) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(index)}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                        activeTab === index ? 'bg-accent text-accent-foreground' : 'text-muted hover:text-foreground'
                      }`}>
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="space-y-3 min-h-[180px]">
                  {activeTab === 0 && (
                    <div className="space-y-3">
                      <NButton className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                        <Zap className="w-4 h-4 mr-2" />
                        Primary Action
                      </NButton>
                      <div className="grid grid-cols-2 gap-2">
                        <NButton isOutline className="text-sm">
                          <Shield className="w-3 h-3 mr-1.5" />
                          Outline
                        </NButton>
                        <NButton isOutline className="text-sm">
                          <Star className="w-3 h-3 mr-1.5" />
                          Secondary
                        </NButton>
                      </div>
                      <div className="flex gap-2">
                        <NChip color="accent" size="sm">
                          React
                        </NChip>
                        <NChip color="success" size="sm">
                          Native
                        </NChip>
                        <NChip color="warning" size="sm">
                          TypeScript
                        </NChip>
                      </div>
                    </div>
                  )}

                  {activeTab === 1 && (
                    <div className="space-y-3">
                      <NInput placeholder="Search components..." />
                      <NSelect
                        value={null}
                        options={[
                          { label: 'React', value: 'react' },
                          { label: 'React Native', value: 'react-native' }
                        ]}
                        placeholder="Choose framework"
                      />
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <input type="checkbox" id="demo-dark" className="rounded" />
                        <label htmlFor="demo-dark">Enable dark mode</label>
                      </div>
                    </div>
                  )}

                  {activeTab === 2 && (
                    <div className="space-y-3">
                      <NCard variant="secondary" className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-accent" />
                            <span className="text-sm font-medium">Team Plan</span>
                          </div>
                          <NBadge color="success">Active</NBadge>
                        </div>
                      </NCard>
                      <NCard variant="secondary" className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Components</span>
                          <span className="text-xs text-muted">50+ available</span>
                        </div>
                        <NProgress value={75} className="mt-2" />
                      </NCard>
                    </div>
                  )}
                </div>
              </div>
            </NCard>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
