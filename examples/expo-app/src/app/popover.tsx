import React, { useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { NButton, NCard, NInput, NPopover, NSwitch, NText, NToast } from '@nayan-ui/react-native';

const Component = () => {
  // User profile state
  const [userProfile, setUserProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    notifications: true,
    darkMode: false
  });

  // Settings state
  const [settings, setSettings] = useState({
    autoSave: true,
    showTips: true,
    language: 'English'
  });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });

  // Feedback state
  const [feedback, setFeedback] = useState({
    rating: 0,
    comment: ''
  });

  const handleProfileUpdate = () => {
    NToast.success('Profile updated successfully!');
  };

  const handleSettingsSave = () => {
    NToast.success('Settings saved!');
  };

  const handleFormSubmit = () => {
    if (formData.title.trim()) {
      NToast.success(`Task "${formData.title}" created!`);
      setFormData({ title: '', description: '', priority: 'medium' });
    } else {
      NToast.error('Please enter a task title');
    }
  };

  const handleFeedbackSubmit = () => {
    if (feedback.rating > 0) {
      NToast.success('Thank you for your feedback!');
      setFeedback({ rating: 0, comment: '' });
    } else {
      NToast.error('Please select a rating');
    }
  };

  const handleRating = (rating: number) => {
    setFeedback(prev => ({ ...prev, rating }));
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Basic Popovers */}
      <NText className="text-xl font-bold mb-3 text-text">Basic Popovers</NText>

      <NCard className="p-4 mb-6">
        <View className="flex-row gap-3 flex-wrap">
          <NPopover trigger={<NButton className="bg-blue-500 border-blue-500">Simple Popover</NButton>}>
            <View className="p-4 w-64 max-w-sm">
              <NText className="text-text font-semibold mb-2">Information</NText>
              <NText className="text-muted text-sm">This is a simple popover with basic text content.</NText>
            </View>
          </NPopover>

          <NPopover trigger={<NButton className="bg-green-500 border-green-500">Rich Content</NButton>}>
            <View className="p-4 w-72 max-w-sm">
              <NText className="text-text font-bold mb-2">📱 Mobile App</NText>
              <NText className="text-muted text-sm mb-3">Our mobile app is now available for download on both iOS and Android platforms.</NText>
              <View className="flex-row gap-2">
                <NButton className="flex-1 bg-blue-600 border-blue-600" onPress={() => NToast.info('Opening App Store...')}>
                  <NText className="text-white text-xs">iOS</NText>
                </NButton>
                <NButton className="flex-1 bg-green-600 border-green-600" onPress={() => NToast.info('Opening Play Store...')}>
                  <NText className="text-white text-xs">Android</NText>
                </NButton>
              </View>
            </View>
          </NPopover>

          <NPopover trigger={<NButton className="bg-purple-500 border-purple-500">With Image</NButton>}>
            <View className="p-4 w-72 max-w-sm">
              <View className="w-full h-24 bg-gray-200 rounded-lg mb-3 items-center justify-center">
                <NText className="text-gray-500">📸 Image</NText>
              </View>
              <NText className="text-text font-semibold mb-1">Product Preview</NText>
              <NText className="text-muted text-sm">Check out our latest features and updates.</NText>
            </View>
          </NPopover>
        </View>
      </NCard>

      {/* Interactive Popovers */}
      <NText className="text-xl font-bold mb-3 text-text">Interactive Popovers</NText>

      <NCard className="p-4 mb-6">
        <View className="flex-row gap-3 flex-wrap">
          {/* User Profile Popover */}
          <NPopover trigger={<NButton className="bg-indigo-500 border-indigo-500">User Profile</NButton>}>
            <View className="p-4 w-80 max-w-sm">
              <View className="flex-row items-center mb-4">
                <View className="w-12 h-12 bg-indigo-100 rounded-full items-center justify-center mr-3">
                  <NText className="text-indigo-600 font-bold text-lg">JD</NText>
                </View>
                <View className="flex-1">
                  <NText className="text-text font-semibold">{userProfile.name}</NText>
                  <NText className="text-muted text-sm">{userProfile.email}</NText>
                </View>
              </View>

              <NInput
                label="Name"
                value={userProfile.name}
                onChangeText={text => setUserProfile(prev => ({ ...prev, name: text }))}
                className="mb-3"
              />

              <NInput
                label="Email"
                value={userProfile.email}
                onChangeText={text => setUserProfile(prev => ({ ...prev, email: text }))}
                className="mb-3"
              />

              <View className="flex-row gap-2">
                <NButton className="flex-1 bg-indigo-600 border-indigo-600" onPress={handleProfileUpdate}>
                  <NText className="text-white text-sm">Update</NText>
                </NButton>
                <NButton className="flex-1 bg-gray-500 border-gray-500" onPress={() => NToast.info('Profile cancelled')}>
                  <NText className="text-white text-sm">Cancel</NText>
                </NButton>
              </View>
            </View>
          </NPopover>

          {/* Settings Popover */}
          <NPopover trigger={<NButton className="bg-orange-500 border-orange-500">Settings</NButton>}>
            <View className="p-4 w-72 max-w-sm">
              <NText className="text-text font-bold mb-4">⚙️ App Settings</NText>

              <NSwitch
                label="Auto Save"
                checked={settings.autoSave}
                onChange={checked => setSettings(prev => ({ ...prev, autoSave: checked }))}
                className="mb-3"
              />

              <NSwitch
                label="Show Tips"
                checked={settings.showTips}
                onChange={checked => setSettings(prev => ({ ...prev, showTips: checked }))}
                className="mb-3"
              />

              <View className="mb-4">
                <NText className="text-text font-medium mb-2">Language</NText>
                <View className="flex-row gap-2">
                  {['English', 'Spanish', 'French'].map(lang => (
                    <NButton
                      key={lang}
                      className={`flex-1 ${settings.language === lang ? 'bg-orange-600 border-orange-600' : 'bg-gray-300 border-gray-300'}`}
                      onPress={() => setSettings(prev => ({ ...prev, language: lang }))}>
                      <NText className={`text-xs ${settings.language === lang ? 'text-white' : 'text-gray-700'}`}>{lang}</NText>
                    </NButton>
                  ))}
                </View>
              </View>

              <NButton className="w-full bg-orange-600 border-orange-600" onPress={handleSettingsSave}>
                <NText className="text-white">Save Settings</NText>
              </NButton>
            </View>
          </NPopover>

          {/* Quick Form Popover */}
          <NPopover trigger={<NButton className="bg-teal-500 border-teal-500">Quick Task</NButton>}>
            <View className="p-4 w-80 max-w-sm">
              <NText className="text-text font-bold mb-4">✅ Create Task</NText>

              <NInput
                label="Task Title"
                value={formData.title}
                onChangeText={text => setFormData(prev => ({ ...prev, title: text }))}
                placeholder="Enter task title..."
                className="mb-3"
              />

              <NInput
                label="Description"
                value={formData.description}
                onChangeText={text => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Optional description..."
                className="mb-3"
                multiline
              />

              <View className="mb-4">
                <NText className="text-text font-medium mb-2">Priority</NText>
                <View className="flex-row gap-2">
                  {[
                    { key: 'low', label: 'Low', color: 'bg-green-500' },
                    { key: 'medium', label: 'Medium', color: 'bg-yellow-500' },
                    { key: 'high', label: 'High', color: 'bg-red-500' }
                  ].map(priority => (
                    <NButton
                      key={priority.key}
                      className={`flex-1 ${formData.priority === priority.key ? priority.color : 'bg-gray-300'} border-transparent`}
                      onPress={() => setFormData(prev => ({ ...prev, priority: priority.key }))}>
                      <NText className={`text-xs ${formData.priority === priority.key ? 'text-white' : 'text-gray-700'}`}>{priority.label}</NText>
                    </NButton>
                  ))}
                </View>
              </View>

              <NButton className="w-full bg-teal-600 border-teal-600" onPress={handleFormSubmit}>
                <NText className="text-white">Create Task</NText>
              </NButton>
            </View>
          </NPopover>
        </View>
      </NCard>

      {/* Information Popovers */}
      <NText className="text-xl font-bold mb-3 text-text">Information Popovers</NText>

      <NCard className="p-4 mb-6">
        <View className="flex-row gap-3 flex-wrap">
          <NPopover trigger={<NButton className="bg-blue-500 border-blue-500">Help & Tips</NButton>}>
            <View className="p-4 w-72 max-w-sm">
              <NText className="text-text font-bold mb-3">💡 Quick Tips</NText>
              <View className="space-y-2">
                <NText className="text-sm text-muted">• Use keyboard shortcuts to work faster</NText>
                <NText className="text-sm text-muted">• Save your work frequently</NText>
                <NText className="text-sm text-muted">• Organize files in folders</NText>
                <NText className="text-sm text-muted">• Use tags for better organization</NText>
              </View>
              <View className="mt-4 pt-3 border-t border-gray-200">
                <NButton className="w-full bg-blue-600 border-blue-600" onPress={() => NToast.info('Opening help center...')}>
                  <NText className="text-white text-sm">View Full Guide</NText>
                </NButton>
              </View>
            </View>
          </NPopover>

          <NPopover trigger={<NButton className="bg-green-500 border-green-500">Statistics</NButton>}>
            <View className="p-4 w-64 max-w-sm">
              <NText className="text-text font-bold mb-3">📊 Your Stats</NText>
              <View className="space-y-3">
                <View className="flex-row justify-between">
                  <NText className="text-muted">Tasks Completed</NText>
                  <NText className="text-text font-semibold">24</NText>
                </View>
                <View className="flex-row justify-between">
                  <NText className="text-muted">Projects Active</NText>
                  <NText className="text-text font-semibold">3</NText>
                </View>
                <View className="flex-row justify-between">
                  <NText className="text-muted">Team Members</NText>
                  <NText className="text-text font-semibold">8</NText>
                </View>
                <View className="flex-row justify-between">
                  <NText className="text-muted">Success Rate</NText>
                  <NText className="text-green-600 font-semibold">94%</NText>
                </View>
              </View>
            </View>
          </NPopover>

          <NPopover trigger={<NButton className="bg-purple-500 border-purple-500">Notifications</NButton>}>
            <View className="p-4 w-80 max-w-sm">
              <NText className="text-text font-bold mb-3">🔔 Recent Activity</NText>
              <View className="space-y-3">
                <View className="flex-row">
                  <View className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3" />
                  <View className="flex-1">
                    <NText className="text-text text-sm font-medium">New message from Sarah</NText>
                    <NText className="text-muted text-xs">2 minutes ago</NText>
                  </View>
                </View>
                <View className="flex-row">
                  <View className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3" />
                  <View className="flex-1">
                    <NText className="text-text text-sm font-medium">Task completed</NText>
                    <NText className="text-muted text-xs">1 hour ago</NText>
                  </View>
                </View>
                <View className="flex-row">
                  <View className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3" />
                  <View className="flex-1">
                    <NText className="text-text text-sm font-medium">Meeting reminder</NText>
                    <NText className="text-muted text-xs">3 hours ago</NText>
                  </View>
                </View>
              </View>
              <View className="mt-4 pt-3 border-t border-gray-200">
                <NButton className="w-full bg-purple-600 border-purple-600" onPress={() => NToast.info('Opening notifications...')}>
                  <NText className="text-white text-sm">View All</NText>
                </NButton>
              </View>
            </View>
          </NPopover>
        </View>
      </NCard>

      {/* Feedback Popover */}
      <NText className="text-xl font-bold mb-3 text-text">Feedback Popover</NText>

      <NCard className="p-4 mb-6">
        <NPopover trigger={<NButton className="bg-pink-500 border-pink-500">Give Feedback</NButton>}>
          <View className="p-4 w-80 max-w-sm">
            <NText className="text-text font-bold mb-4">⭐ Rate Your Experience</NText>

            <View className="mb-4">
              <NText className="text-text font-medium mb-2">How was your experience?</NText>
              <View className="flex-row justify-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <NButton
                    key={star}
                    className={`w-10 h-10 rounded-full ${feedback.rating >= star ? 'bg-yellow-400' : 'bg-gray-200'} border-transparent`}
                    onPress={() => handleRating(star)}>
                    <NText className="text-lg">⭐</NText>
                  </NButton>
                ))}
              </View>
            </View>

            <NInput
              label="Comments (Optional)"
              value={feedback.comment}
              onChangeText={text => setFeedback(prev => ({ ...prev, comment: text }))}
              placeholder="Tell us more about your experience..."
              multiline
              className="mb-4"
            />

            <View className="flex-row gap-2">
              <NButton className="flex-1 bg-pink-600 border-pink-600" onPress={handleFeedbackSubmit}>
                <NText className="text-white text-sm">Submit</NText>
              </NButton>
              <NButton className="flex-1 bg-gray-500 border-gray-500" onPress={() => setFeedback({ rating: 0, comment: '' })}>
                <NText className="text-white text-sm">Clear</NText>
              </NButton>
            </View>
          </View>
        </NPopover>
      </NCard>

      {/* Custom Styled Popovers */}
      <NText className="text-xl font-bold mb-3 text-text">Custom Styled Popovers</NText>

      <NCard className="p-4 mb-6">
        <View className="flex-row gap-3 flex-wrap">
          <NPopover
            trigger={<NButton className="bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500">Gradient Style</NButton>}
            className="bg-gradient-to-b from-purple-50 to-pink-50 border-purple-200">
            <View className="p-4 w-64 max-w-sm">
              <NText className="text-purple-800 font-bold mb-2">🎨 Custom Design</NText>
              <NText className="text-purple-700 text-sm mb-3">This popover uses custom gradient styling and themed colors.</NText>
              <NButton className="w-full bg-purple-600 border-purple-600" onPress={() => NToast.success('Styled action!')}>
                <NText className="text-white text-sm">Action Button</NText>
              </NButton>
            </View>
          </NPopover>

          <NPopover
            trigger={<NButton className="bg-gray-800 border-gray-800 text-white">Dark Theme</NButton>}
            className="bg-gray-800 border-gray-700">
            <View className="p-4 w-64 max-w-sm">
              <NText className="text-gray-100 font-bold mb-2">🌙 Dark Mode</NText>
              <NText className="text-gray-300 text-sm mb-3">Dark themed popover with custom styling and colors.</NText>
              <NButton className="w-full bg-gray-600 border-gray-600" onPress={() => NToast.info('Dark action!')}>
                <NText className="text-white text-sm">Dark Action</NText>
              </NButton>
            </View>
          </NPopover>

          <NPopover trigger={<NButton className="bg-yellow-400 border-yellow-400 text-black">Compact</NButton>} className="w-48 max-w-xs">
            <View className="p-3">
              <NText className="text-text font-semibold text-sm mb-2">Quick Info</NText>
              <NText className="text-muted text-xs mb-3">Compact popover design</NText>
              <NButton className="w-full bg-yellow-500 border-yellow-500" onPress={() => NToast.info('Compact action!')}>
                <NText className="text-black text-xs">Go</NText>
              </NButton>
            </View>
          </NPopover>
        </View>
      </NCard>

      {/* Different Trigger Types */}
      <NText className="text-xl font-bold mb-3 text-text">Different Trigger Types</NText>

      <NCard className="p-4 mb-6">
        <View className="space-y-4">
          <View className="flex-row items-center gap-3">
            <NText className="text-text font-medium">Text Trigger:</NText>
            <NPopover trigger={<NText className="text-blue-600 underline">Click here for info</NText>}>
              <View className="p-3 w-56 max-w-xs">
                <NText className="text-text font-semibold mb-1">Text Trigger</NText>
                <NText className="text-muted text-sm">You can use any text as a popover trigger.</NText>
              </View>
            </NPopover>
          </View>

          <View className="flex-row items-center gap-3">
            <NText className="text-text font-medium">Icon Trigger:</NText>
            <NPopover
              trigger={
                <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center">
                  <NText className="text-blue-600">ℹ️</NText>
                </View>
              }>
              <View className="p-3 w-56 max-w-xs">
                <NText className="text-text font-semibold mb-1">Icon Trigger</NText>
                <NText className="text-muted text-sm">Icons make great popover triggers for help and info.</NText>
              </View>
            </NPopover>
          </View>

          <View className="flex-row items-center gap-3">
            <NText className="text-text font-medium">Card Trigger:</NText>
            <NPopover
              trigger={
                <View className="bg-green-100 p-3 rounded-lg border border-green-200">
                  <NText className="text-green-800 font-medium text-sm">Tap for details</NText>
                </View>
              }>
              <View className="p-4 w-64 max-w-sm">
                <NText className="text-text font-semibold mb-2">Card Details</NText>
                <NText className="text-muted text-sm mb-3">Cards can be interactive triggers for detailed information.</NText>
                <View className="flex-row gap-2">
                  <NButton className="flex-1 bg-green-600 border-green-600" onPress={() => NToast.success('Action 1')}>
                    <NText className="text-white text-xs">Action 1</NText>
                  </NButton>
                  <NButton className="flex-1 bg-blue-600 border-blue-600" onPress={() => NToast.info('Action 2')}>
                    <NText className="text-white text-xs">Action 2</NText>
                  </NButton>
                </View>
              </View>
            </NPopover>
          </View>
        </View>
      </NCard>

      {/* Best Practices */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3">💡 Popover Best Practices</NText>
        <View className="space-y-2">
          <NText className="text-sm text-muted">• Keep popover content concise and focused</NText>
          <NText className="text-sm text-muted">• Use appropriate trigger elements (buttons, icons, text)</NText>
          <NText className="text-sm text-muted">• Provide clear actions and navigation within popovers</NText>
          <NText className="text-sm text-muted">• Consider mobile-friendly sizing and touch targets</NText>
          <NText className="text-sm text-muted">• Use popovers for contextual information and quick actions</NText>
          <NText className="text-sm text-muted">• Ensure popovers are accessible and keyboard navigable</NText>
          <NText className="text-sm text-muted">• Test popover positioning on different screen sizes</NText>
          <NText className="text-sm text-muted">• Provide feedback for user actions within popovers</NText>
        </View>
      </NCard>
    </ScrollView>
  );
};

export default Component;
