'use client';

import { NCard } from '@nayan-ui/react';
import { Monitor, Smartphone } from 'lucide-react';

const tagColors = [
  'bg-blue-500/12 text-blue-700 dark:text-blue-300 border border-blue-500/20',
  'bg-purple-500/12 text-purple-700 dark:text-purple-300 border border-purple-500/20',
  'bg-pink-500/12 text-pink-700 dark:text-pink-300 border border-pink-500/20',
  'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20',
  'bg-cyan-500/12 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20',
  'bg-violet-500/12 text-violet-700 dark:text-violet-300 border border-violet-500/20',
  'bg-sky-500/12 text-sky-700 dark:text-sky-300 border border-sky-500/20',
  'bg-fuchsia-500/12 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-500/20'
];

const greenTagColors = [
  'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20',
  'bg-teal-500/12 text-teal-700 dark:text-teal-300 border border-teal-500/20',
  'bg-green-500/12 text-green-700 dark:text-green-300 border border-green-500/20',
  'bg-lime-500/12 text-lime-700 dark:text-lime-300 border border-lime-500/20',
  'bg-cyan-500/12 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20',
  'bg-sky-500/12 text-sky-700 dark:text-sky-300 border border-sky-500/20',
  'bg-teal-500/12 text-teal-700 dark:text-teal-300 border border-teal-500/20',
  'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
];

const Showcase = () => {
  const reactComponents = [
    'Accordion',
    'Alert',
    'Badge',
    'Button',
    'Card',
    'Checkbox',
    'Chip',
    'Confirm Alert',
    'Dialog',
    'Divider',
    'Form Input',
    'Infinite Scroll',
    'Input',
    'Link',
    'Loading',
    'Menu',
    'Meter',
    'Number Field',
    'Popover',
    'Progress',
    'Radio Group',
    'Search Field',
    'Select',
    'Sheet',
    'Skeleton',
    'Slider',
    'Switch',
    'Table',
    'Tabs',
    'Tag Group',
    'Textarea',
    'Toast',
    'Tooltip'
  ];

  const reactNativeComponents = [
    'Accordion',
    'Action Item',
    'Alert',
    'Avatar',
    'Button',
    'Button Group',
    'Card',
    'Checkbox',
    'Chip',
    'Confirm',
    'Dialog',
    'Divider',
    'Input',
    'Input Group',
    'Input OTP',
    'Loading',
    'Menu',
    'Popover',
    'Progress',
    'Radio',
    'Select',
    'Sheet',
    'Skeleton',
    'Slider',
    'Switch',
    'Tabs',
    'Tag Group',
    'Text',
    'Textarea',
    'Text Field',
    'Toast',
    'Tooltip'
  ];

  return (
    <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 via-transparent to-blue-600/5" />
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
            Available <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Components</span>
          </h2>
          <p className="text-base sm:text-lg text-muted">A growing library of production-ready components for both platforms.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <NCard className="p-6 border-blue-500/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                <Monitor className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">@nayan-ui/react</h3>
                <p className="text-xs text-muted">{reactComponents.length} components for web</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {reactComponents.map((name, i) => (
                <span key={name} className={`px-2.5 py-1 text-xs rounded-md font-medium ${tagColors[i % tagColors.length]}`}>
                  {name}
                </span>
              ))}
            </div>
          </NCard>

          <NCard className="p-6 border-emerald-500/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Smartphone className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">@nayan-ui/react-native</h3>
                <p className="text-xs text-muted">{reactNativeComponents.length} components for mobile</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {reactNativeComponents.map((name, i) => (
                <span key={name} className={`px-2.5 py-1 text-xs rounded-md font-medium ${greenTagColors[i % greenTagColors.length]}`}>
                  {name}
                </span>
              ))}
            </div>
          </NCard>
        </div>
      </div>
    </section>
  );
};

export default Showcase;
