import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NButton, NCard, NText, NToast } from '@nayan-ui/react-native';

const Component = () => {
  const [selectedText, setSelectedText] = useState('');
  const [showMore, setShowMore] = useState(false);

  const longText =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

  const handleTextPress = (text: string) => {
    setSelectedText(text);
    NToast.success(`Selected: ${text}`);
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Typography Hierarchy */}
      <NText className="text-xl font-bold mb-3 text-text">Typography Hierarchy</NText>

      <NCard className="p-4 mb-6">
        <View className="space-y-4">
          {/* Headings */}
          <View>
            <NText className="text-muted text-sm mb-2">Headings</NText>
            <NText className="text-4xl font-bold text-text mb-2">Heading 1 - 4xl</NText>
            <NText className="text-3xl font-bold text-text mb-2">Heading 2 - 3xl</NText>
            <NText className="text-2xl font-bold text-text mb-2">Heading 3 - 2xl</NText>
            <NText className="text-xl font-bold text-text mb-2">Heading 4 - xl</NText>
            <NText className="text-lg font-bold text-text mb-2">Heading 5 - lg</NText>
            <NText className="text-base font-bold text-text">Heading 6 - base</NText>
          </View>

          {/* Body Text */}
          <View>
            <NText className="text-muted text-sm mb-2">Body Text</NText>
            <NText className="text-lg text-text mb-2">Large body text - Perfect for introductions and important content.</NText>
            <NText className="text-base text-text mb-2">Regular body text - The standard text size for most content and paragraphs.</NText>
            <NText className="text-sm text-text mb-2">Small body text - Used for secondary information and details.</NText>
            <NText className="text-xs text-text">Extra small text - For captions, labels, and fine print.</NText>
          </View>
        </View>
      </NCard>

      {/* Font Weights */}
      <NText className="text-xl font-bold mb-3 text-text">Font Weights</NText>

      <NCard className="p-4 mb-6">
        <View className="space-y-3">
          <NText className="font-thin text-text">Thin weight (100) - Very light text</NText>
          <NText className="font-extralight text-text">Extra light weight (200) - Lighter than normal</NText>
          <NText className="font-light text-text">Light weight (300) - Light text</NText>
          <NText className="font-normal text-text">Normal weight (400) - Regular text</NText>
          <NText className="font-medium text-text">Medium weight (500) - Slightly bold</NText>
          <NText className="font-semibold text-text">Semibold weight (600) - Semi bold text</NText>
          <NText className="font-bold text-text">Bold weight (700) - Bold text</NText>
          <NText className="font-extrabold text-text">Extra bold weight (800) - Very bold</NText>
          <NText className="font-black text-text">Black weight (900) - Heaviest weight</NText>
        </View>
      </NCard>

      {/* Colors and Themes */}
      <NText className="text-xl font-bold mb-3 text-text">Colors and Themes</NText>

      <NCard className="p-4 mb-6">
        <View className="space-y-4">
          {/* Semantic Colors */}
          <View>
            <NText className="text-muted text-sm mb-2">Semantic Colors</NText>
            <NText className="text-text mb-1">Primary text color</NText>
            <NText className="text-muted mb-1">Muted text color</NText>
            <NText className="text-green-600 mb-1">Success text color</NText>
            <NText className="text-red-600 mb-1">Error text color</NText>
            <NText className="text-yellow-600 mb-1">Warning text color</NText>
            <NText className="text-blue-600 mb-1">Info text color</NText>
          </View>

          {/* Color Variations */}
          <View>
            <NText className="text-muted text-sm mb-2">Color Variations</NText>
            <View className="flex-row flex-wrap gap-2">
              <NText className="text-gray-500">Gray</NText>
              <NText className="text-red-500">Red</NText>
              <NText className="text-orange-500">Orange</NText>
              <NText className="text-yellow-500">Yellow</NText>
              <NText className="text-green-500">Green</NText>
              <NText className="text-blue-500">Blue</NText>
              <NText className="text-indigo-500">Indigo</NText>
              <NText className="text-purple-500">Purple</NText>
              <NText className="text-pink-500">Pink</NText>
            </View>
          </View>
        </View>
      </NCard>

      {/* Text Alignment */}
      <NText className="text-xl font-bold mb-3 text-text">Text Alignment</NText>

      <NCard className="p-4 mb-6">
        <View className="space-y-4">
          <View className="p-3 border border-gray-200 rounded">
            <NText className="text-left text-text">Left aligned text - This is the default alignment for most text content.</NText>
          </View>
          <View className="p-3 border border-gray-200 rounded">
            <NText className="text-center text-text">Center aligned text - Perfect for headings and important announcements.</NText>
          </View>
          <View className="p-3 border border-gray-200 rounded">
            <NText className="text-right text-text">Right aligned text - Often used for numbers and dates.</NText>
          </View>
          <View className="p-3 border border-gray-200 rounded">
            <NText className="text-justify text-text">
              Justified text - This text is justified to create even margins on both sides. It's commonly used in formal documents and publications
              where a clean, professional appearance is desired.
            </NText>
          </View>
        </View>
      </NCard>

      {/* Text Decorations */}
      <NText className="text-xl font-bold mb-3 text-text">Text Decorations</NText>

      <NCard className="p-4 mb-6">
        <View className="space-y-3">
          <NText className="underline text-text">Underlined text - Often used for links</NText>
          <NText className="line-through text-text">Strikethrough text - Shows deleted or outdated content</NText>
          <NText className="no-underline text-blue-500">No underline - Removes default link styling</NText>
          <NText className="uppercase text-text">UPPERCASE TEXT - ALL CAPS</NText>
          <NText className="lowercase text-text">lowercase text - all lowercase</NText>
          <NText className="capitalize text-text">capitalized text - first letter of each word</NText>
          <NText className="italic text-text">Italic text - Emphasized or stylized</NText>
          <NText className="not-italic text-text">Not italic - Removes italic styling</NText>
        </View>
      </NCard>

      {/* Interactive Text */}
      <NText className="text-xl font-bold mb-3 text-text">Interactive Text</NText>

      <NCard className="p-4 mb-6">
        <View className="space-y-4">
          {/* Selectable Text */}
          <View>
            <NText className="text-muted text-sm mb-2">Selectable Text</NText>
            <NText className="text-blue-600 underline" onPress={() => handleTextPress('Interactive Link')}>
              Interactive Link - Tap to select
            </NText>
            <NText className="text-green-600 font-medium mt-2" onPress={() => handleTextPress('Clickable Text')}>
              Clickable Text - Press me!
            </NText>
            {selectedText && (
              <View className="mt-3 p-2 bg-blue-50 rounded">
                <NText className="text-blue-800 text-sm">Selected: {selectedText}</NText>
              </View>
            )}
          </View>

          {/* Long Press Text */}
          <View>
            <NText className="text-muted text-sm mb-2">Long Press Text</NText>
            <NText className="text-purple-600 font-medium" onLongPress={() => NToast.info('Long press detected!')}>
              Long press this text for action
            </NText>
          </View>
        </View>
      </NCard>

      {/* Text Truncation */}
      <NText className="text-xl font-bold mb-3 text-text">Text Truncation</NText>

      <NCard className="p-4 mb-6">
        <View className="space-y-4">
          {/* Single Line Truncation */}
          <View>
            <NText className="text-muted text-sm mb-2">Single Line Truncation</NText>
            <View className="border border-gray-200 rounded p-3">
              <NText className="text-text truncate" numberOfLines={1}>
                This is a very long text that will be truncated to fit in a single line and show ellipsis at the end
              </NText>
            </View>
          </View>

          {/* Multi-line Truncation */}
          <View>
            <NText className="text-muted text-sm mb-2">Multi-line Truncation</NText>
            <View className="border border-gray-200 rounded p-3">
              <NText className="text-text" numberOfLines={3}>
                {longText}
              </NText>
            </View>
          </View>

          {/* Expandable Text */}
          <View>
            <NText className="text-muted text-sm mb-2">Expandable Text</NText>
            <View className="border border-gray-200 rounded p-3">
              <NText className="text-text" numberOfLines={showMore ? undefined : 2}>
                {longText}
              </NText>
              <NButton className="mt-2 bg-blue-500 border-blue-500" onPress={() => setShowMore(!showMore)}>
                <NText className="text-white text-sm">{showMore ? 'Show Less' : 'Show More'}</NText>
              </NButton>
            </View>
          </View>
        </View>
      </NCard>

      {/* Practical Examples */}
      <NText className="text-xl font-bold mb-3 text-text">Practical Examples</NText>

      <NCard className="p-4 mb-6">
        <View className="space-y-6">
          {/* Article Layout */}
          <View>
            <NText className="text-muted text-sm mb-2">Article Layout</NText>
            <View className="p-4 border border-gray-200 rounded">
              <NText className="text-2xl font-bold text-text mb-2">Article Title</NText>
              <NText className="text-sm text-muted mb-4">Published on January 15, 2024 • 5 min read</NText>
              <NText className="text-base text-text leading-6 mb-4">
                This is the article introduction paragraph. It provides a brief overview of what the reader can expect from the content.
              </NText>
              <NText className="text-lg font-semibold text-text mb-2">Section Heading</NText>
              <NText className="text-base text-text leading-6">
                This is the main content of the article section. It contains detailed information and explanations.
              </NText>
            </View>
          </View>

          {/* User Profile */}
          <View>
            <NText className="text-muted text-sm mb-2">User Profile</NText>
            <View className="p-4 border border-gray-200 rounded">
              <NText className="text-xl font-bold text-text mb-1">John Doe</NText>
              <NText className="text-sm text-blue-600 mb-2">@johndoe</NText>
              <NText className="text-base text-text mb-3">Software Developer passionate about React Native and mobile development.</NText>
              <View className="flex-row gap-4">
                <NText className="text-sm text-muted">📍 San Francisco, CA</NText>
                <NText className="text-sm text-muted">🔗 johndoe.dev</NText>
              </View>
            </View>
          </View>

          {/* Message Thread */}
          <View>
            <NText className="text-muted text-sm mb-2">Message Thread</NText>
            <View className="space-y-3">
              <View className="p-3 bg-blue-50 rounded-lg">
                <NText className="text-sm font-medium text-blue-800 mb-1">Alice Johnson</NText>
                <NText className="text-sm text-blue-700">Hey! How's the project coming along?</NText>
                <NText className="text-xs text-blue-600 mt-1">2:30 PM</NText>
              </View>
              <View className="p-3 bg-gray-50 rounded-lg ml-8">
                <NText className="text-sm font-medium text-gray-800 mb-1">You</NText>
                <NText className="text-sm text-gray-700">Great! Just finished the UI components. Ready for review.</NText>
                <NText className="text-xs text-gray-600 mt-1">2:32 PM</NText>
              </View>
            </View>
          </View>

          {/* Stats Dashboard */}
          <View>
            <NText className="text-muted text-sm mb-2">Stats Dashboard</NText>
            <View className="flex-row gap-4">
              <View className="flex-1 p-3 bg-green-50 rounded-lg">
                <NText className="text-2xl font-bold text-green-800">1,247</NText>
                <NText className="text-sm text-green-600">Total Users</NText>
                <NText className="text-xs text-green-500">↑ 12% from last month</NText>
              </View>
              <View className="flex-1 p-3 bg-blue-50 rounded-lg">
                <NText className="text-2xl font-bold text-blue-800">$12,450</NText>
                <NText className="text-sm text-blue-600">Revenue</NText>
                <NText className="text-xs text-blue-500">↑ 8% from last month</NText>
              </View>
            </View>
          </View>
        </View>
      </NCard>

      {/* Accessibility */}
      <NText className="text-xl font-bold mb-3 text-text">Accessibility</NText>

      <NCard className="p-4 mb-6">
        <View className="space-y-4">
          <View>
            <NText className="text-muted text-sm mb-2">Screen Reader Friendly</NText>
            <NText
              className="text-text"
              accessibilityLabel="This text is optimized for screen readers"
              accessibilityHint="Provides additional context for accessibility">
              Text with accessibility labels
            </NText>
          </View>

          <View>
            <NText className="text-muted text-sm mb-2">High Contrast</NText>
            <View className="p-3 bg-black rounded">
              <NText className="text-white font-medium">High contrast white text on black background</NText>
            </View>
          </View>

          <View>
            <NText className="text-muted text-sm mb-2">Large Text for Readability</NText>
            <NText className="text-xl text-text leading-8">Larger text size with increased line height for better readability</NText>
          </View>
        </View>
      </NCard>

      {/* Best Practices */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3">💡 Text Best Practices</NText>
        <View className="space-y-2">
          <NText className="text-sm text-muted">• Use consistent typography hierarchy throughout your app</NText>
          <NText className="text-sm text-muted">• Ensure sufficient color contrast for accessibility</NText>
          <NText className="text-sm text-muted">• Choose appropriate font sizes for different screen sizes</NText>
          <NText className="text-sm text-muted">• Use semantic colors to convey meaning (red for errors, green for success)</NText>
          <NText className="text-sm text-muted">• Implement text truncation for long content</NText>
          <NText className="text-sm text-muted">• Add accessibility labels for screen readers</NText>
          <NText className="text-sm text-muted">• Use appropriate line heights for better readability</NText>
          <NText className="text-sm text-muted">• Test text rendering on different devices and orientations</NText>
        </View>
      </NCard>
    </ScrollView>
  );
};

export default Component;
