import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NAccordion, NButton, NText, NToast } from '@nayan-ui/react-native';

const Component = () => {
  const [customItems, setCustomItems] = useState([
    {
      id: 'custom-1',
      title: 'Dynamic Item 1',
      content: 'This is a dynamically created accordion item.',
      disabled: false
    },
    {
      id: 'custom-2',
      title: 'Dynamic Item 2',
      content: 'This item can be toggled on/off.',
      disabled: false
    }
  ]);

  // Basic FAQ items
  const faqItems = [
    {
      id: 'faq-1',
      title: 'What is React Native?',
      content:
        'React Native is a framework for building native mobile applications using React. It allows you to write code once and deploy it on both iOS and Android platforms.'
    },
    {
      id: 'faq-2',
      title: 'How does Nayan UI work?',
      content:
        'Nayan UI provides a comprehensive set of pre-built components that follow design system principles. Each component is optimized for both React and React Native platforms.'
    },
    {
      id: 'faq-3',
      title: 'Is it free to use?',
      content: 'Yes, Nayan UI is completely free and open source. You can use it in both personal and commercial projects without any restrictions.'
    },
    {
      id: 'faq-4',
      title: 'How do I get support?',
      content: 'You can get support through our GitHub repository, Discord community, or by checking our comprehensive documentation.'
    }
  ];

  // Product features
  const featureItems = [
    {
      id: 'feature-1',
      title: '🚀 Performance Optimized',
      content:
        'All components are built with performance in mind, using React.memo, useMemo, and other optimization techniques to ensure smooth user experience.'
    },
    {
      id: 'feature-2',
      title: '🎨 Customizable Theming',
      content: 'Complete theming system with light/dark mode support, custom color schemes, and the ability to override any component styling.'
    },
    {
      id: 'feature-3',
      title: '♿ Accessibility First',
      content: 'Built-in accessibility features including screen reader support, keyboard navigation, and proper ARIA labels for all components.'
    },
    {
      id: 'feature-4',
      title: '📱 Cross Platform',
      content: 'Works seamlessly on both React and React Native platforms with consistent API and behavior across all environments.'
    }
  ];

  // Settings items with some disabled
  const settingsItems = [
    {
      id: 'settings-1',
      title: 'Account Settings',
      content: 'Manage your account information, password, and security settings. Update your profile details and preferences.'
    },
    {
      id: 'settings-2',
      title: 'Notification Preferences',
      content: 'Configure how and when you receive notifications. Choose between email, push notifications, and in-app alerts.',
      disabled: false
    },
    {
      id: 'settings-3',
      title: 'Privacy Settings (Coming Soon)',
      content: 'This feature is currently under development and will be available in the next update.',
      disabled: true
    },
    {
      id: 'settings-4',
      title: 'Advanced Options',
      content: 'Advanced configuration options for power users. These settings require technical knowledge to configure properly.'
    }
  ];

  const toggleCustomItem = (index: number) => {
    setCustomItems(prev => prev.map((item, i) => (i === index ? { ...item, disabled: !item.disabled } : item)));
  };

  const addCustomItem = () => {
    const newItem = {
      id: `custom-${Date.now()}`,
      title: `New Item ${customItems.length + 1}`,
      content: `This is a newly added accordion item created at ${new Date().toLocaleTimeString()}.`,
      disabled: false
    };
    setCustomItems(prev => [...prev, newItem]);
    NToast.success('New item added!');
  };

  const removeLastItem = () => {
    if (customItems.length > 0) {
      setCustomItems(prev => prev.slice(0, -1));
      NToast.info('Last item removed!');
    }
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Basic Single Accordion */}
      <NText className="text-xl font-bold mb-3 text-text">Basic FAQ (Single)</NText>
      <NText className="text-sm text-muted mb-4">Only one item can be expanded at a time</NText>
      <NAccordion
        items={faqItems}
        multiple={false}
        className="mb-6"
        itemClassName="border border-border rounded-lg mb-2 bg-card"
        titleClassName="text-text font-semibold"
        contentClassName="text-muted leading-relaxed"
      />

      {/* Multiple Accordion */}
      <NText className="text-xl font-bold mb-3 text-text">Product Features (Multiple)</NText>
      <NText className="text-sm text-muted mb-4">Multiple items can be expanded simultaneously</NText>
      <NAccordion
        items={featureItems}
        multiple={true}
        defaultValue={['feature-1', 'feature-2']}
        className="mb-6"
        itemClassName="border border-border rounded-lg mb-2 bg-card shadow-sm"
        titleClassName="text-text font-semibold"
        contentClassName="text-muted leading-relaxed"
      />

      {/* Accordion with Disabled Items */}
      <NText className="text-xl font-bold mb-3 text-text">Settings (With Disabled Items)</NText>
      <NText className="text-sm text-muted mb-4">Some items are disabled and cannot be expanded</NText>
      <NAccordion
        items={settingsItems}
        multiple={false}
        className="mb-6"
        itemClassName="border border-border rounded-lg mb-2 bg-card"
        titleClassName="text-text font-semibold"
        contentClassName="text-muted leading-relaxed"
      />

      {/* Custom Styled Accordion */}
      <NText className="text-xl font-bold mb-3 text-text">Custom Styled</NText>
      <NText className="text-sm text-muted mb-4">Accordion with custom colors and styling</NText>
      <NAccordion
        items={[
          {
            id: 'styled-1',
            title: 'Premium Feature',
            content: 'This is a premium feature with custom styling. It demonstrates how you can customize the appearance of accordion items.'
          },
          {
            id: 'styled-2',
            title: 'Advanced Configuration',
            content:
              'Advanced settings and configuration options are available here. These options provide fine-grained control over the component behavior.'
          }
        ]}
        multiple={false}
        className="mb-6"
        itemClassName="border-2 border-purple-500 rounded-xl mb-3 bg-purple-50"
        titleClassName="text-purple-800 font-bold text-lg"
        contentClassName="text-purple-700 leading-relaxed"
      />

      {/* Dynamic Accordion */}
      <NText className="text-xl font-bold mb-3 text-text">Dynamic Accordion</NText>
      <NText className="text-sm text-muted mb-4">Add, remove, and toggle items dynamically</NText>

      <View className="flex-row flex-wrap gap-2 mb-4">
        <NButton className="bg-green-500 border-green-500" onPress={addCustomItem}>
          Add Item
        </NButton>
        <NButton className="bg-red-500 border-red-500" onPress={removeLastItem} disabled={customItems.length === 0}>
          Remove Last
        </NButton>
      </View>

      <View className="flex-row flex-wrap gap-2 mb-4">
        {customItems.map((item, index) => (
          <NButton
            key={item.id}
            className={`${item.disabled ? 'bg-gray-400 border-gray-400' : 'bg-blue-500 border-blue-500'}`}
            onPress={() => toggleCustomItem(index)}>
            {item.disabled ? 'Enable' : 'Disable'} Item {index + 1}
          </NButton>
        ))}
      </View>

      <NAccordion
        items={customItems}
        multiple={true}
        className="mb-6"
        itemClassName="border border-border rounded-lg mb-2 bg-card"
        titleClassName="text-text font-semibold"
        contentClassName="text-muted leading-relaxed"
      />

      {/* Minimal Accordion */}
      <NText className="text-xl font-bold mb-3 text-text">Minimal Style</NText>
      <NText className="text-sm text-muted mb-4">Clean, minimal accordion without borders</NText>
      <NAccordion
        items={[
          {
            id: 'minimal-1',
            title: 'Simple Question',
            content: 'This is a simple answer to a simple question. The design is clean and minimal.'
          },
          {
            id: 'minimal-2',
            title: 'Another Question',
            content: 'Another simple answer with minimal styling for a clean look.'
          }
        ]}
        multiple={false}
        className="mb-6"
        itemClassName="border-b border-border py-2"
        titleClassName="text-text font-medium"
        contentClassName="text-muted"
      />

      {/* Help Section */}
      <View className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <NText className="text-blue-800 font-semibold mb-2">💡 Accordion Tips</NText>
        <NText className="text-blue-700 text-sm leading-relaxed">
          • Use single mode for FAQs where only one answer should be visible at a time{'\n'}• Use multiple mode for feature lists or settings where
          users might want to compare options{'\n'}• Disable items that are not yet available or require special permissions{'\n'}• Customize styling
          to match your app's design system{'\n'}• Keep titles concise and descriptive for better user experience
        </NText>
      </View>
    </ScrollView>
  );
};

export default Component;
