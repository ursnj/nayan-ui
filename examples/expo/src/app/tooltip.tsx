import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NButton, NCard, NText, NTooltip } from '@nayan-ui/react-native';
import { Bell, Download, Heart, HelpCircle, Info, Lock, Settings, Share, Star, User } from 'lucide-react-native';

const Component = () => {
  const [tooltipCount, setTooltipCount] = useState(0);
  const [tooltipHistory, setTooltipHistory] = useState<Array<{ message: string; timestamp: string }>>([]);

  const addTooltipAction = (message: string) => {
    setTooltipCount(prev => prev + 1);
    setTooltipHistory(prev =>
      [
        ...prev,
        {
          message,
          timestamp: new Date().toLocaleTimeString()
        }
      ].slice(-5)
    ); // Keep only last 5 entries
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        {/* Header */}
        <NText className="text-2xl font-bold mb-2 text-text">Tooltip Examples</NText>
        <NText className="text-muted mb-6">Interactive tooltip demonstrations with various styles and use cases</NText>

        {/* Basic Tooltips */}
        <NText className="text-xl font-bold mb-3 text-text">Basic Tooltips</NText>
        <NCard className="mb-6">
          <View className="flex-row flex-wrap gap-4 justify-center">
            <NTooltip message="This is a simple tooltip">
              <NButton className="bg-blue-500 border-blue-500" onPress={() => addTooltipAction('Basic tooltip')}>
                <NText className="text-white">Hover Me</NText>
              </NButton>
            </NTooltip>

            <NTooltip message="Tooltip with longer descriptive text that provides more context">
              <NButton className="bg-green-500 border-green-500" onPress={() => addTooltipAction('Long tooltip')}>
                <NText className="text-white">Long Text</NText>
              </NButton>
            </NTooltip>

            <NTooltip message="Short tip">
              <NButton className="bg-purple-500 border-purple-500" onPress={() => addTooltipAction('Short tooltip')}>
                <NText className="text-white">Short</NText>
              </NButton>
            </NTooltip>
          </View>
        </NCard>

        {/* Icon Tooltips */}
        <NText className="text-xl font-bold mb-3 text-text">Icon Tooltips</NText>
        <NCard className="mb-6">
          <View className="flex-row flex-wrap gap-4 justify-center">
            <NTooltip message="Get help and support">
              <View className="p-3 bg-blue-100 rounded-full" onTouchEnd={() => addTooltipAction('Help icon tooltip')}>
                <HelpCircle size={24} color="#3b82f6" />
              </View>
            </NTooltip>

            <NTooltip message="Information about this feature">
              <View className="p-3 bg-green-100 rounded-full" onTouchEnd={() => addTooltipAction('Info icon tooltip')}>
                <Info size={24} color="#10b981" />
              </View>
            </NTooltip>

            <NTooltip message="Open settings panel">
              <View className="p-3 bg-gray-100 rounded-full" onTouchEnd={() => addTooltipAction('Settings icon tooltip')}>
                <Settings size={24} color="#6b7280" />
              </View>
            </NTooltip>

            <NTooltip message="View user profile">
              <View className="p-3 bg-purple-100 rounded-full" onTouchEnd={() => addTooltipAction('User icon tooltip')}>
                <User size={24} color="#8b5cf6" />
              </View>
            </NTooltip>
          </View>
        </NCard>

        {/* Interactive Elements with Tooltips */}
        <NText className="text-xl font-bold mb-3 text-text">Interactive Elements</NText>
        <NCard className="mb-6">
          <View className="space-y-4">
            <View className="flex-row items-center justify-between">
              <NText className="text-text">Actions</NText>
              <View className="flex-row gap-3">
                <NTooltip message="Add to favorites">
                  <View className="p-2 bg-red-100 rounded" onTouchEnd={() => addTooltipAction('Favorite action')}>
                    <Heart size={20} color="#ef4444" />
                  </View>
                </NTooltip>

                <NTooltip message="Rate this item">
                  <View className="p-2 bg-yellow-100 rounded" onTouchEnd={() => addTooltipAction('Rate action')}>
                    <Star size={20} color="#f59e0b" />
                  </View>
                </NTooltip>

                <NTooltip message="Enable notifications">
                  <View className="p-2 bg-blue-100 rounded" onTouchEnd={() => addTooltipAction('Notification action')}>
                    <Bell size={20} color="#3b82f6" />
                  </View>
                </NTooltip>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <NText className="text-text">File Operations</NText>
              <View className="flex-row gap-3">
                <NTooltip message="Download file">
                  <View className="p-2 bg-green-100 rounded" onTouchEnd={() => addTooltipAction('Download action')}>
                    <Download size={20} color="#10b981" />
                  </View>
                </NTooltip>

                <NTooltip message="Share with others">
                  <View className="p-2 bg-indigo-100 rounded" onTouchEnd={() => addTooltipAction('Share action')}>
                    <Share size={20} color="#6366f1" />
                  </View>
                </NTooltip>

                <NTooltip message="Lock file">
                  <View className="p-2 bg-gray-100 rounded" onTouchEnd={() => addTooltipAction('Lock action')}>
                    <Lock size={20} color="#6b7280" />
                  </View>
                </NTooltip>
              </View>
            </View>
          </View>
        </NCard>

        {/* Custom Styled Tooltips */}
        <NText className="text-xl font-bold mb-3 text-text">Custom Styled Tooltips</NText>
        <NCard className="mb-6">
          <View className="flex-row flex-wrap gap-4 justify-center">
            <NTooltip message="Success tooltip with custom styling" className="bg-green-500">
              <NButton className="bg-green-500 border-green-500" onPress={() => addTooltipAction('Success styled tooltip')}>
                <NText className="text-white">Success Style</NText>
              </NButton>
            </NTooltip>

            <NTooltip message="Warning tooltip with custom styling" className="bg-yellow-500">
              <NButton className="bg-yellow-500 border-yellow-500" onPress={() => addTooltipAction('Warning styled tooltip')}>
                <NText className="text-white">Warning Style</NText>
              </NButton>
            </NTooltip>

            <NTooltip message="Error tooltip with custom styling" className="bg-red-500">
              <NButton className="bg-red-500 border-red-500" onPress={() => addTooltipAction('Error styled tooltip')}>
                <NText className="text-white">Error Style</NText>
              </NButton>
            </NTooltip>
          </View>
        </NCard>

        {/* Form Field Tooltips */}
        <NText className="text-xl font-bold mb-3 text-text">Form Field Tooltips</NText>
        <NCard className="mb-6">
          <View className="space-y-4">
            <View className="flex-row items-center">
              <NText className="text-text flex-1">Username</NText>
              <NTooltip message="Enter your unique username (3-20 characters)">
                <View className="ml-2 p-1" onTouchEnd={() => addTooltipAction('Username help')}>
                  <HelpCircle size={16} color="#6b7280" />
                </View>
              </NTooltip>
            </View>

            <View className="flex-row items-center">
              <NText className="text-text flex-1">Password</NText>
              <NTooltip message="Password must be at least 8 characters with uppercase, lowercase, and numbers">
                <View className="ml-2 p-1" onTouchEnd={() => addTooltipAction('Password help')}>
                  <HelpCircle size={16} color="#6b7280" />
                </View>
              </NTooltip>
            </View>

            <View className="flex-row items-center">
              <NText className="text-text flex-1">Email Notifications</NText>
              <NTooltip message="Choose how often you want to receive email updates">
                <View className="ml-2 p-1" onTouchEnd={() => addTooltipAction('Email help')}>
                  <Info size={16} color="#3b82f6" />
                </View>
              </NTooltip>
            </View>
          </View>
        </NCard>

        {/* Contextual Tooltips */}
        <NText className="text-xl font-bold mb-3 text-text">Contextual Tooltips</NText>
        <NCard className="mb-6">
          <View className="space-y-4">
            <View className="bg-blue-50 p-4 rounded-lg">
              <View className="flex-row items-center justify-between mb-2">
                <NText className="font-semibold text-blue-900">Premium Feature</NText>
                <NTooltip message="This feature is available in the Premium plan. Upgrade to unlock advanced analytics and reporting.">
                  <View onTouchEnd={() => addTooltipAction('Premium feature info')}>
                    <Info size={20} color="#3b82f6" />
                  </View>
                </NTooltip>
              </View>
              <NText className="text-blue-700 text-sm">Advanced analytics dashboard</NText>
            </View>

            <View className="bg-green-50 p-4 rounded-lg">
              <View className="flex-row items-center justify-between mb-2">
                <NText className="font-semibold text-green-900">Storage Usage</NText>
                <NTooltip message="You're using 75% of your storage quota. Consider upgrading or cleaning up old files.">
                  <View onTouchEnd={() => addTooltipAction('Storage info')}>
                    <Info size={20} color="#10b981" />
                  </View>
                </NTooltip>
              </View>
              <NText className="text-green-700 text-sm">7.5 GB of 10 GB used</NText>
            </View>
          </View>
        </NCard>

        {/* Tooltip Statistics */}
        <NText className="text-xl font-bold mb-3 text-text">Tooltip Statistics</NText>
        <NCard className="mb-6">
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <NText className="text-muted">Total Tooltip Interactions:</NText>
              <NText className="font-semibold text-text">{tooltipCount}</NText>
            </View>

            {tooltipHistory.length > 0 && (
              <>
                <View className="border-t border-border pt-3">
                  <NText className="font-semibold text-text mb-2">Recent Interactions:</NText>
                  {tooltipHistory.map((item, index) => (
                    <View key={index} className="flex-row justify-between py-1">
                      <NText className="text-sm text-muted flex-1">{item.message}</NText>
                      <NText className="text-xs text-muted ml-2">{item.timestamp}</NText>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </NCard>

        {/* Best Practices */}
        <NText className="text-xl font-bold mb-3 text-text">Best Practices</NText>
        <NCard>
          <View className="space-y-3">
            <View>
              <NText className="font-semibold text-green-600 mb-1">✓ Do:</NText>
              <NText className="text-sm text-muted">• Keep tooltip text concise and helpful</NText>
              <NText className="text-sm text-muted">• Use tooltips for additional context, not essential information</NText>
              <NText className="text-sm text-muted">• Place tooltips near interactive elements</NText>
              <NText className="text-sm text-muted">• Use consistent tooltip styling across your app</NText>
            </View>

            <View>
              <NText className="font-semibold text-red-600 mb-1">✗ Don't:</NText>
              <NText className="text-sm text-muted">• Use tooltips for critical information</NText>
              <NText className="text-sm text-muted">• Make tooltip text too long or complex</NText>
              <NText className="text-sm text-muted">• Overuse tooltips on every element</NText>
              <NText className="text-sm text-muted">• Hide important actions behind tooltips</NText>
            </View>
          </View>
        </NCard>
      </View>
    </ScrollView>
  );
};

export default Component;
