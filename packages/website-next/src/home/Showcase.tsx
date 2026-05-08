'use client';

import { NCard } from '@nayan-ui/react';

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
    <section className="py-16 sm:py-20 lg:py-24 bg-surface/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Available Components</h2>
          <p className="text-base sm:text-lg text-muted">A growing library of production-ready components for both platforms.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <NCard className="p-6">
            <h3 className="text-lg font-semibold mb-1">@nayan-ui/react</h3>
            <p className="text-sm text-muted mb-4">{reactComponents.length} components for web</p>
            <div className="flex flex-wrap gap-2">
              {reactComponents.map(name => (
                <span key={name} className="px-2.5 py-1 bg-accent/10 text-accent text-xs rounded-md font-medium">
                  {name}
                </span>
              ))}
            </div>
          </NCard>

          <NCard className="p-6">
            <h3 className="text-lg font-semibold mb-1">@nayan-ui/react-native</h3>
            <p className="text-sm text-muted mb-4">{reactNativeComponents.length} components for mobile</p>
            <div className="flex flex-wrap gap-2">
              {reactNativeComponents.map(name => (
                <span key={name} className="px-2.5 py-1 bg-green-500/10 text-green-600 text-xs rounded-md font-medium">
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
