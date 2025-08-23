import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NCard, NPress, NText, NToast } from '@nayan-ui/react-native';
import { Bell, Bookmark, Heart, Pause, Play, Search, Settings, Share2, Star, User, Volume2, VolumeX } from 'lucide-react-native';

const Component = () => {
  const [isLiked, setIsLiked] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [pressCount, setPressCount] = useState(0);
  const [longPressCount, setLongPressCount] = useState(0);
  const [pressHistory, setPressHistory] = useState<Array<{ type: string; time: string }>>([]);

  const addToHistory = (type: string) => {
    const newEntry = { type, time: new Date().toLocaleTimeString() };
    setPressHistory(prev => [newEntry, ...prev.slice(0, 4)]);
  };

  const handlePress = (action: string) => {
    setPressCount(prev => prev + 1);
    addToHistory(`Press: ${action}`);
    NToast.success(action);
  };

  const handleLongPress = (action: string) => {
    setLongPressCount(prev => prev + 1);
    addToHistory(`Long Press: ${action}`);
    NToast.info(`Long press: ${action}`);
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4 space-y-6">
        {/* Basic Pressable Buttons */}
        <NCard className="p-4">
          <NText className="text-lg font-semibold mb-4">Basic Pressable Buttons</NText>
          <View className="flex-row flex-wrap gap-3">
            <NPress className="bg-blue-500 px-4 py-3 rounded-lg" onPress={() => handlePress('Blue Button')}>
              <NText className="text-white font-medium">Blue Button</NText>
            </NPress>

            <NPress className="bg-green-500 px-4 py-3 rounded-lg" onPress={() => handlePress('Green Button')}>
              <NText className="text-white font-medium">Green Button</NText>
            </NPress>

            <NPress className="bg-red-500 px-4 py-3 rounded-lg" onPress={() => handlePress('Red Button')}>
              <NText className="text-white font-medium">Red Button</NText>
            </NPress>
          </View>
        </NCard>

        {/* Interactive Icons */}
        <NCard className="p-4">
          <NText className="text-lg font-semibold mb-4">Interactive Icons</NText>
          <View className="flex-row flex-wrap gap-4">
            <NPress
              className="p-3 rounded-full bg-red-50 border border-red-200"
              onPress={() => {
                setIsLiked(!isLiked);
                handlePress(isLiked ? 'Unliked' : 'Liked');
              }}>
              <Heart size={24} color={isLiked ? '#ef4444' : '#6b7280'} fill={isLiked ? '#ef4444' : 'none'} />
            </NPress>

            <NPress
              className="p-3 rounded-full bg-yellow-50 border border-yellow-200"
              onPress={() => {
                setIsStarred(!isStarred);
                handlePress(isStarred ? 'Unstarred' : 'Starred');
              }}>
              <Star size={24} color={isStarred ? '#eab308' : '#6b7280'} fill={isStarred ? '#eab308' : 'none'} />
            </NPress>

            <NPress
              className="p-3 rounded-full bg-blue-50 border border-blue-200"
              onPress={() => {
                setIsBookmarked(!isBookmarked);
                handlePress(isBookmarked ? 'Unbookmarked' : 'Bookmarked');
              }}>
              <Bookmark size={24} color={isBookmarked ? '#3b82f6' : '#6b7280'} fill={isBookmarked ? '#3b82f6' : 'none'} />
            </NPress>

            <NPress className="p-3 rounded-full bg-green-50 border border-green-200" onPress={() => handlePress('Shared')}>
              <Share2 size={24} color="#16a34a" />
            </NPress>
          </View>
        </NCard>

        {/* Media Controls */}
        <NCard className="p-4">
          <NText className="text-lg font-semibold mb-4">Media Controls</NText>
          <View className="flex-row gap-4">
            <NPress
              className="p-4 rounded-full bg-blue-500"
              onPress={() => {
                setIsPlaying(!isPlaying);
                handlePress(isPlaying ? 'Paused' : 'Playing');
              }}>
              {isPlaying ? <Pause size={28} color="white" /> : <Play size={28} color="white" />}
            </NPress>

            <NPress
              className="p-4 rounded-full bg-gray-500"
              onPress={() => {
                setIsMuted(!isMuted);
                handlePress(isMuted ? 'Unmuted' : 'Muted');
              }}>
              {isMuted ? <VolumeX size={28} color="white" /> : <Volume2 size={28} color="white" />}
            </NPress>
          </View>
        </NCard>

        {/* Long Press Actions */}
        <NCard className="p-4">
          <NText className="text-lg font-semibold mb-4">Long Press Actions</NText>
          <View className="flex-row flex-wrap gap-3">
            <NPress
              className="bg-purple-500 px-4 py-3 rounded-lg"
              onPress={() => handlePress('Quick Action')}
              onLongPress={() => handleLongPress('Advanced Action')}>
              <NText className="text-white font-medium">Press or Hold</NText>
            </NPress>

            <NPress
              className="bg-orange-500 px-4 py-3 rounded-lg"
              onPress={() => handlePress('Save')}
              onLongPress={() => handleLongPress('Save & Share')}>
              <NText className="text-white font-medium">Save</NText>
            </NPress>
          </View>
          <NText className="text-sm text-muted mt-2">Tap for quick action, hold for additional options</NText>
        </NCard>

        {/* Pressable Cards */}
        <NCard className="p-4">
          <NText className="text-lg font-semibold mb-4">Pressable Cards</NText>
          <View className="space-y-3">
            <NPress className="p-4 bg-white border border-gray-200 rounded-lg" onPress={() => handlePress('User Profile')}>
              <View className="flex-row items-center space-x-3">
                <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center">
                  <User size={24} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <NText className="font-semibold">User Profile</NText>
                  <NText className="text-sm text-muted">View and edit your profile</NText>
                </View>
              </View>
            </NPress>

            <NPress className="p-4 bg-white border border-gray-200 rounded-lg" onPress={() => handlePress('Settings')}>
              <View className="flex-row items-center space-x-3">
                <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center">
                  <Settings size={24} color="#6b7280" />
                </View>
                <View className="flex-1">
                  <NText className="font-semibold">Settings</NText>
                  <NText className="text-sm text-muted">Manage app preferences</NText>
                </View>
              </View>
            </NPress>

            <NPress className="p-4 bg-white border border-gray-200 rounded-lg" onPress={() => handlePress('Notifications')}>
              <View className="flex-row items-center space-x-3">
                <View className="w-12 h-12 bg-yellow-100 rounded-full items-center justify-center">
                  <Bell size={24} color="#eab308" />
                </View>
                <View className="flex-1">
                  <NText className="font-semibold">Notifications</NText>
                  <NText className="text-sm text-muted">Manage notification settings</NText>
                </View>
              </View>
            </NPress>
          </View>
        </NCard>

        {/* Custom Styled Pressables */}
        <NCard className="p-4">
          <NText className="text-lg font-semibold mb-4">Custom Styled Pressables</NText>
          <View className="space-y-3">
            <NPress className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl" onPress={() => handlePress('Gradient Button')}>
              <NText className="text-white font-bold text-center">Gradient Button</NText>
            </NPress>

            <NPress className="p-4 border-2 border-blue-500 rounded-lg bg-transparent" onPress={() => handlePress('Outlined Button')}>
              <NText className="text-blue-500 font-semibold text-center">Outlined Button</NText>
            </NPress>

            <NPress className="p-4 bg-black rounded-full" onPress={() => handlePress('Rounded Button')}>
              <NText className="text-white font-medium text-center">Rounded Button</NText>
            </NPress>

            <NPress className="px-6 py-2 bg-green-500 rounded-md" onPress={() => handlePress('Compact Button')}>
              <NText className="text-white text-sm font-medium text-center">Compact</NText>
            </NPress>
          </View>
        </NCard>

        {/* Search Bar Pressable */}
        <NCard className="p-4">
          <NText className="text-lg font-semibold mb-4">Search Bar Pressable</NText>
          <NPress className="flex-row items-center p-3 bg-gray-100 rounded-lg border border-gray-200" onPress={() => handlePress('Search')}>
            <Search size={20} color="#6b7280" />
            <NText className="ml-3 text-gray-500">Search for anything...</NText>
          </NPress>
        </NCard>

        {/* Disabled State */}
        <NCard className="p-4">
          <NText className="text-lg font-semibold mb-4">Disabled State</NText>
          <NPress className="p-4 bg-gray-300 rounded-lg opacity-50" disabled={true} onPress={() => handlePress('Disabled Button')}>
            <NText className="text-gray-600 font-medium text-center">Disabled Button</NText>
          </NPress>
          <NText className="text-sm text-muted mt-2">This button is disabled and won't respond to touches</NText>
        </NCard>

        {/* Press Statistics */}
        <NCard className="p-4">
          <NText className="text-lg font-semibold mb-4">📊 Press Statistics</NText>
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <NText className="text-muted">Total Presses:</NText>
              <NText className="font-semibold">{pressCount}</NText>
            </View>
            <View className="flex-row justify-between">
              <NText className="text-muted">Long Presses:</NText>
              <NText className="font-semibold">{longPressCount}</NText>
            </View>
            <View className="flex-row justify-between">
              <NText className="text-muted">Total Actions:</NText>
              <NText className="font-semibold">{pressCount + longPressCount}</NText>
            </View>
          </View>

          <View className="mt-4">
            <NText className="font-semibold mb-2">Recent Actions:</NText>
            {pressHistory.length > 0 ? (
              pressHistory.map((entry, index) => (
                <View key={index} className="flex-row justify-between py-1">
                  <NText className="text-sm text-muted">{entry.type}</NText>
                  <NText className="text-xs text-muted">{entry.time}</NText>
                </View>
              ))
            ) : (
              <NText className="text-sm text-muted">No actions yet</NText>
            )}
          </View>
        </NCard>

        {/* Best Practices */}
        <NCard className="p-4 mb-6">
          <NText className="text-lg font-semibold mb-3">💡 Pressable Best Practices</NText>
          <View className="space-y-2">
            <NText className="text-sm text-muted">• Provide clear visual feedback on press (opacity, scale, color change)</NText>
            <NText className="text-sm text-muted">• Use appropriate touch targets (minimum 44x44 points)</NText>
            <NText className="text-sm text-muted">• Consider long press for secondary actions</NText>
            <NText className="text-sm text-muted">• Implement proper disabled states with visual indicators</NText>
            <NText className="text-sm text-muted">• Use semantic colors and icons for better UX</NText>
            <NText className="text-sm text-muted">• Test pressables on different screen sizes and devices</NText>
            <NText className="text-sm text-muted">• Provide haptic feedback for important actions</NText>
            <NText className="text-sm text-muted">• Keep press actions immediate and responsive</NText>
          </View>
        </NCard>
      </View>
    </ScrollView>
  );
};

export default Component;
