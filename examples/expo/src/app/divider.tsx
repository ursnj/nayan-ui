import { ScrollView, View } from 'react-native';
import { NButton, NCard, NDivider, NText } from '@nayan-ui/react-native';

const Component = () => {
  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Basic Horizontal Dividers */}
      <NText className="text-xl font-bold mb-3 text-text">Basic Horizontal Dividers</NText>

      <NCard className="p-4 mb-6">
        <NText className="mb-3">Default horizontal divider</NText>
        <NDivider />
        <NText className="mt-3 mb-3">Content after divider</NText>

        <NDivider className="my-4" />

        <NText className="mb-3">Custom spacing with margin classes</NText>
        <NDivider className="my-6" />
        <NText className="mt-3">More content below</NText>
      </NCard>

      {/* Vertical Dividers */}
      <NText className="text-xl font-bold mb-3 text-text">Vertical Dividers</NText>

      <NCard className="p-4 mb-6">
        <NText className="mb-3">Inline text with vertical dividers:</NText>
        <View className="flex-row items-center">
          <NText>Home</NText>
          <NDivider orientation="vertical" className="mx-3 h-4" />
          <NText>About</NText>
          <NDivider orientation="vertical" className="mx-3 h-4" />
          <NText>Contact</NText>
        </View>

        <View className="mt-4 flex-row items-center justify-center">
          <NButton className="px-4 py-2">Action 1</NButton>
          <NDivider orientation="vertical" className="mx-2 h-8" />
          <NButton className="px-4 py-2">Action 2</NButton>
          <NDivider orientation="vertical" className="mx-2 h-8" />
          <NButton className="px-4 py-2">Action 3</NButton>
        </View>
      </NCard>

      {/* Custom Styled Dividers */}
      <NText className="text-xl font-bold mb-3 text-text">Custom Styled Dividers</NText>

      <NCard className="p-4 mb-6">
        <NText className="mb-3">Colored dividers:</NText>
        <NDivider className="bg-red-500 h-0.5" />
        <NText className="my-3">Red divider above</NText>

        <NDivider className="bg-blue-500 h-1" />
        <NText className="my-3">Thicker blue divider above</NText>

        <NDivider className="bg-green-500 h-px" />
        <NText className="mt-3">Thin green divider above</NText>
      </NCard>

      {/* Section Separators */}
      <NText className="text-xl font-bold mb-3 text-text">Section Separators</NText>

      <NCard className="p-4 mb-6">
        <View>
          <NText className="text-lg font-semibold mb-2">User Information</NText>
          <NText className="text-sm text-muted-foreground mb-3">Basic user details and preferences</NText>

          <NDivider className="my-4" />

          <NText className="text-lg font-semibold mb-2">Account Settings</NText>
          <NText className="text-sm text-muted-foreground mb-3">Security and privacy options</NText>

          <NDivider className="my-4" />

          <NText className="text-lg font-semibold mb-2">Notifications</NText>
          <NText className="text-sm text-muted-foreground">Communication preferences</NText>
        </View>
      </NCard>

      {/* List Item Separators */}
      <NText className="text-xl font-bold mb-3 text-text">List Item Separators</NText>

      <NCard className="p-4 mb-6">
        <View>
          <View className="py-3">
            <NText className="font-medium">John Doe</NText>
            <NText className="text-sm text-muted-foreground">john.doe@example.com</NText>
          </View>

          <NDivider />

          <View className="py-3">
            <NText className="font-medium">Jane Smith</NText>
            <NText className="text-sm text-muted-foreground">jane.smith@example.com</NText>
          </View>

          <NDivider />

          <View className="py-3">
            <NText className="font-medium">Mike Johnson</NText>
            <NText className="text-sm text-muted-foreground">mike.johnson@example.com</NText>
          </View>
        </View>
      </NCard>

      {/* Complex Layouts */}
      <NText className="text-xl font-bold mb-3 text-text">Complex Layouts</NText>

      <NCard className="p-4 mb-6">
        <View className="flex-row">
          <View className="flex-1">
            <NText className="font-semibold mb-2">Left Column</NText>
            <NText className="text-sm text-muted-foreground">This is the left side content with some information.</NText>
          </View>

          <NDivider orientation="vertical" className="mx-4 h-20" />

          <View className="flex-1">
            <NText className="font-semibold mb-2">Right Column</NText>
            <NText className="text-sm text-muted-foreground">This is the right side content with different information.</NText>
          </View>
        </View>

        <NDivider className="my-4" />

        <View className="flex-row justify-between items-center">
          <NText className="font-medium">Total Items: 24</NText>
          <NDivider orientation="vertical" className="mx-3 h-4" />
          <NText className="font-medium">Active: 18</NText>
          <NDivider orientation="vertical" className="mx-3 h-4" />
          <NText className="font-medium">Inactive: 6</NText>
        </View>
      </NCard>

      {/* Card Separators */}
      <NText className="text-xl font-bold mb-3 text-text">Card Content Separators</NText>

      <NCard className="p-4 mb-6">
        <View>
          <NText className="text-lg font-bold mb-1">Product Title</NText>
          <NText className="text-sm text-muted-foreground mb-3">SKU: PRD-001</NText>

          <NDivider className="mb-3" />

          <NText className="font-semibold mb-2">Description</NText>
          <NText className="text-sm mb-3">This is a detailed description of the product with all its features and benefits.</NText>

          <NDivider className="mb-3" />

          <View className="flex-row justify-between items-center">
            <NText className="text-lg font-bold">$99.99</NText>
            <NText className="text-sm text-green-600">In Stock</NText>
          </View>
        </View>
      </NCard>

      {/* Spacing Variations */}
      <NText className="text-xl font-bold mb-3 text-text">Spacing Variations</NText>

      <NCard className="p-4 mb-6">
        <NText>Tight spacing</NText>
        <NDivider className="my-1" />
        <NText>Content with minimal spacing</NText>

        <NDivider className="my-3" />

        <NText>Normal spacing</NText>
        <NDivider className="my-4" />
        <NText>Content with standard spacing</NText>

        <NDivider className="my-6" />

        <NText>Loose spacing</NText>
        <NDivider className="my-8" />
        <NText>Content with generous spacing</NText>
      </NCard>

      {/* Dashboard Layout */}
      <NText className="text-xl font-bold mb-3 text-text">Dashboard Layout Example</NText>

      <NCard className="p-4 mb-6">
        <View>
          <View className="flex-row justify-between items-center mb-4">
            <NText className="text-lg font-bold">Dashboard Overview</NText>
            <NText className="text-sm text-muted-foreground">Last updated: 2 min ago</NText>
          </View>

          <NDivider className="mb-4" />

          <View className="flex-row mb-4">
            <View className="flex-1 items-center">
              <NText className="text-2xl font-bold">1,234</NText>
              <NText className="text-sm text-muted-foreground">Total Users</NText>
            </View>

            <NDivider orientation="vertical" className="mx-4 h-12" />

            <View className="flex-1 items-center">
              <NText className="text-2xl font-bold">567</NText>
              <NText className="text-sm text-muted-foreground">Active Sessions</NText>
            </View>

            <NDivider orientation="vertical" className="mx-4 h-12" />

            <View className="flex-1 items-center">
              <NText className="text-2xl font-bold">89%</NText>
              <NText className="text-sm text-muted-foreground">Uptime</NText>
            </View>
          </View>

          <NDivider className="mb-4" />

          <NText className="font-semibold mb-2">Recent Activity</NText>
          <NText className="text-sm text-muted-foreground">Latest system events and user actions</NText>
        </View>
      </NCard>

      {/* Best Practices */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3">💡 Divider Best Practices</NText>
        <View className="space-y-2">
          <NText className="text-sm">• Use horizontal dividers to separate content sections</NText>
          <NText className="text-sm">• Use vertical dividers for inline content separation</NText>
          <NText className="text-sm">• Apply consistent spacing with margin classes (my-3, my-4, etc.)</NText>
          <NText className="text-sm">• Customize colors and thickness with className props</NText>
          <NText className="text-sm">• Set appropriate heights for vertical dividers (h-4, h-8, etc.)</NText>
          <NText className="text-sm">• Don't overuse dividers - they should enhance, not clutter</NText>
          <NText className="text-sm">• Consider using subtle colors that match your theme</NText>
        </View>
      </NCard>
    </ScrollView>
  );
};

export default Component;
