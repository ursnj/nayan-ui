import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NButton, NCard, NSkeleton, NText, NToast } from '@nayan-ui/react-native';

const Component = () => {
  // Loading states for different sections
  const [loadingStates, setLoadingStates] = useState({
    profile: true,
    messages: true,
    media: true,
    articles: true,
    dashboard: true,
    products: true,
    social: true,
    settings: true
  });

  // Loading history
  const [loadingHistory, setLoadingHistory] = useState<string[]>([]);

  // Auto-complete loading simulation
  useEffect(() => {
    const timers = [
      setTimeout(() => toggleLoading('profile'), 2000),
      setTimeout(() => toggleLoading('messages'), 3500),
      setTimeout(() => toggleLoading('media'), 5000),
      setTimeout(() => toggleLoading('articles'), 6500),
      setTimeout(() => toggleLoading('dashboard'), 8000),
      setTimeout(() => toggleLoading('products'), 9500),
      setTimeout(() => toggleLoading('social'), 11000),
      setTimeout(() => toggleLoading('settings'), 12500)
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  const toggleLoading = (section: keyof typeof loadingStates) => {
    setLoadingStates(prev => {
      const newState = { ...prev, [section]: !prev[section] };
      const action = newState[section] ? 'started' : 'completed';
      const timestamp = new Date().toLocaleTimeString();
      setLoadingHistory(prev => [...prev.slice(-9), `${timestamp}: ${section} loading ${action}`]);
      NToast.info(`${section.charAt(0).toUpperCase() + section.slice(1)} loading ${action}`);
      return newState;
    });
  };

  const resetAllLoading = () => {
    setLoadingStates({
      profile: true,
      messages: true,
      media: true,
      articles: true,
      dashboard: true,
      products: true,
      social: true,
      settings: true
    });
    setLoadingHistory([]);
    NToast.success('All loading states reset!');
  };

  const loadingCount = Object.values(loadingStates).filter(Boolean).length;
  const completedCount = 8 - loadingCount;

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        <NText className="text-2xl font-bold text-text mb-2">Skeleton Loading Examples</NText>
        <NText className="text-muted mb-4">Comprehensive skeleton patterns for different content types</NText>

        {/* Loading Statistics */}
        <NCard className="mb-6 p-4 bg-blue-50 border-blue-200">
          <NText className="text-lg font-semibold text-blue-800 mb-2">Loading Statistics</NText>
          <View className="flex-row justify-between mb-2">
            <NText className="text-blue-700">Currently Loading: {loadingCount}/8</NText>
            <NText className="text-blue-700">Completed: {completedCount}/8</NText>
          </View>
          <View className="flex-row gap-2">
            <NButton onPress={resetAllLoading} className="border-blue-300 bg-blue-100 px-3 py-2 rounded-md border">
              Reset All
            </NButton>
          </View>
        </NCard>

        {/* Basic Skeleton Shapes */}
        <NCard className="mb-6 p-4">
          <NText className="text-lg font-semibold text-text mb-4">Basic Skeleton Shapes</NText>
          <View className="gap-3">
            {/* Lines */}
            <View>
              <NText className="text-sm text-muted mb-2">Text Lines</NText>
              <NSkeleton className="w-full h-4 mb-2" />
              <NSkeleton className="w-3/4 h-4 mb-2" />
              <NSkeleton className="w-1/2 h-4" />
            </View>

            {/* Circles */}
            <View>
              <NText className="text-sm text-muted mb-2">Circular Shapes (Avatars)</NText>
              <View className="flex-row gap-3">
                <NSkeleton className="w-12 h-12 rounded-full" />
                <NSkeleton className="w-16 h-16 rounded-full" />
                <NSkeleton className="w-20 h-20 rounded-full" />
              </View>
            </View>

            {/* Rectangles */}
            <View>
              <NText className="text-sm text-muted mb-2">Rectangular Shapes</NText>
              <View className="gap-2">
                <NSkeleton className="w-full h-32 rounded-lg" />
                <NSkeleton className="w-full h-16 rounded-md" />
                <NSkeleton className="w-2/3 h-8 rounded" />
              </View>
            </View>
          </View>
        </NCard>

        {/* User Profile Loading */}
        <NCard className="mb-6 p-4">
          <View className="flex-row justify-between items-center mb-4">
            <NText className="text-lg font-semibold text-text">User Profile Loading</NText>
            <NButton onPress={() => toggleLoading('profile')} className="px-3 py-2 rounded-md border border-gray-300 bg-white">
              {loadingStates.profile ? 'Complete' : 'Start'} Loading
            </NButton>
          </View>

          {loadingStates.profile ? (
            <View className="flex-row items-start gap-4">
              <NSkeleton className="w-20 h-20 rounded-full" />
              <View className="flex-1">
                <NSkeleton className="w-3/4 h-6 mb-2" />
                <NSkeleton className="w-1/2 h-4 mb-2" />
                <NSkeleton className="w-full h-4 mb-2" />
                <NSkeleton className="w-2/3 h-4" />
              </View>
            </View>
          ) : (
            <View className="flex-row items-start gap-4">
              <View className="w-20 h-20 rounded-full bg-blue-500 items-center justify-center">
                <NText className="text-white font-bold text-xl">JD</NText>
              </View>
              <View className="flex-1">
                <NText className="text-lg font-bold text-text">John Doe</NText>
                <NText className="text-muted">Software Engineer</NText>
                <NText className="text-text mt-1">Passionate developer with 5+ years of experience in React Native and mobile development.</NText>
                <NText className="text-blue-600 mt-1">📍 San Francisco, CA</NText>
              </View>
            </View>
          )}
        </NCard>

        {/* Message List Loading */}
        <NCard className="mb-6 p-4">
          <View className="flex-row justify-between items-center mb-4">
            <NText className="text-lg font-semibold text-text">Message List Loading</NText>
            <NButton onPress={() => toggleLoading('messages')} className="px-3 py-2 rounded-md border border-gray-300 bg-white">
              {loadingStates.messages ? 'Complete' : 'Start'} Loading
            </NButton>
          </View>

          {loadingStates.messages ? (
            <View className="gap-4">
              {[1, 2, 3].map(i => (
                <View key={i} className="flex-row items-start gap-3">
                  <NSkeleton className="w-12 h-12 rounded-full" />
                  <View className="flex-1">
                    <View className="flex-row justify-between mb-1">
                      <NSkeleton className="w-1/3 h-4" />
                      <NSkeleton className="w-16 h-3" />
                    </View>
                    <NSkeleton className="w-full h-4 mb-1" />
                    <NSkeleton className="w-2/3 h-4" />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="gap-4">
              {[
                { name: 'Alice Johnson', time: '2m ago', message: 'Hey! How are you doing today?', avatar: 'AJ' },
                { name: 'Bob Smith', time: '15m ago', message: 'The meeting has been rescheduled to 3 PM.', avatar: 'BS' },
                { name: 'Carol Davis', time: '1h ago', message: 'Thanks for the help with the project!', avatar: 'CD' }
              ].map((msg, i) => (
                <View key={i} className="flex-row items-start gap-3">
                  <View className="w-12 h-12 rounded-full bg-green-500 items-center justify-center">
                    <NText className="text-white font-bold text-sm">{msg.avatar}</NText>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row justify-between mb-1">
                      <NText className="font-semibold text-text">{msg.name}</NText>
                      <NText className="text-xs text-muted">{msg.time}</NText>
                    </View>
                    <NText className="text-text">{msg.message}</NText>
                  </View>
                </View>
              ))}
            </View>
          )}
        </NCard>

        {/* Media Grid Loading */}
        <NCard className="mb-6 p-4">
          <View className="flex-row justify-between items-center mb-4">
            <NText className="text-lg font-semibold text-text">Media Grid Loading</NText>
            <NButton onPress={() => toggleLoading('media')} className="px-3 py-2 rounded-md border border-gray-300 bg-white">
              {loadingStates.media ? 'Complete' : 'Start'} Loading
            </NButton>
          </View>

          {loadingStates.media ? (
            <View className="flex-row flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <NSkeleton key={i} className="w-24 h-24 rounded-lg" />
              ))}
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} className="w-24 h-24 rounded-lg bg-purple-500 items-center justify-center">
                  <NText className="text-white text-xs">📷</NText>
                  <NText className="text-white text-xs">IMG {i + 1}</NText>
                </View>
              ))}
            </View>
          )}
        </NCard>

        {/* Article Content Loading */}
        <NCard className="mb-6 p-4">
          <View className="flex-row justify-between items-center mb-4">
            <NText className="text-lg font-semibold text-text">Article Content Loading</NText>
            <NButton onPress={() => toggleLoading('articles')} className="px-3 py-2 rounded-md border border-gray-300 bg-white">
              {loadingStates.articles ? 'Complete' : 'Start'} Loading
            </NButton>
          </View>

          {loadingStates.articles ? (
            <View>
              <NSkeleton className="w-full h-6 mb-3" />
              <NSkeleton className="w-full h-32 rounded-lg mb-3" />
              <NSkeleton className="w-full h-4 mb-2" />
              <NSkeleton className="w-full h-4 mb-2" />
              <NSkeleton className="w-3/4 h-4 mb-3" />
              <View className="flex-row gap-2">
                <NSkeleton className="w-16 h-6 rounded-full" />
                <NSkeleton className="w-20 h-6 rounded-full" />
                <NSkeleton className="w-12 h-6 rounded-full" />
              </View>
            </View>
          ) : (
            <View>
              <NText className="text-xl font-bold text-text mb-3">Understanding React Native Performance</NText>
              <View className="w-full h-32 rounded-lg bg-orange-500 items-center justify-center mb-3">
                <NText className="text-white text-lg">📱</NText>
                <NText className="text-white">Article Image</NText>
              </View>
              <NText className="text-text mb-2">
                React Native offers excellent performance when optimized correctly. This article covers best practices for building smooth, responsive
                mobile applications.
              </NText>
              <NText className="text-text mb-3">Key topics include component optimization, memory management, and rendering performance.</NText>
              <View className="flex-row gap-2">
                <View className="px-3 py-1 bg-blue-100 rounded-full">
                  <NText className="text-blue-800 text-xs">React Native</NText>
                </View>
                <View className="px-3 py-1 bg-green-100 rounded-full">
                  <NText className="text-green-800 text-xs">Performance</NText>
                </View>
                <View className="px-3 py-1 bg-purple-100 rounded-full">
                  <NText className="text-purple-800 text-xs">Mobile</NText>
                </View>
              </View>
            </View>
          )}
        </NCard>

        {/* Dashboard Stats Loading */}
        <NCard className="mb-6 p-4">
          <View className="flex-row justify-between items-center mb-4">
            <NText className="text-lg font-semibold text-text">Dashboard Stats Loading</NText>
            <NButton onPress={() => toggleLoading('dashboard')} className="px-3 py-2 rounded-md border border-gray-300 bg-white">
              {loadingStates.dashboard ? 'Complete' : 'Start'} Loading
            </NButton>
          </View>

          {loadingStates.dashboard ? (
            <View className="gap-4">
              <View className="flex-row gap-4">
                <View className="flex-1 p-4 border border-border rounded-lg">
                  <NSkeleton className="w-8 h-8 rounded mb-2" />
                  <NSkeleton className="w-16 h-6 mb-1" />
                  <NSkeleton className="w-12 h-4" />
                </View>
                <View className="flex-1 p-4 border border-border rounded-lg">
                  <NSkeleton className="w-8 h-8 rounded mb-2" />
                  <NSkeleton className="w-16 h-6 mb-1" />
                  <NSkeleton className="w-12 h-4" />
                </View>
              </View>
              <NSkeleton className="w-full h-48 rounded-lg" />
            </View>
          ) : (
            <View className="gap-4">
              <View className="flex-row gap-4">
                <View className="flex-1 p-4 border border-border rounded-lg bg-blue-50">
                  <NText className="text-2xl mb-1">📊</NText>
                  <NText className="text-xl font-bold text-blue-800">1,234</NText>
                  <NText className="text-sm text-blue-600">Total Users</NText>
                </View>
                <View className="flex-1 p-4 border border-border rounded-lg bg-green-50">
                  <NText className="text-2xl mb-1">💰</NText>
                  <NText className="text-xl font-bold text-green-800">$45.6K</NText>
                  <NText className="text-sm text-green-600">Revenue</NText>
                </View>
              </View>
              <View className="w-full h-48 rounded-lg bg-gray-100 items-center justify-center">
                <NText className="text-4xl mb-2">📈</NText>
                <NText className="text-gray-600">Analytics Chart</NText>
              </View>
            </View>
          )}
        </NCard>

        {/* Product Cards Loading */}
        <NCard className="mb-6 p-4">
          <View className="flex-row justify-between items-center mb-4">
            <NText className="text-lg font-semibold text-text">Product Cards Loading</NText>
            <NButton onPress={() => toggleLoading('products')} className="px-3 py-2 rounded-md border border-gray-300 bg-white">
              {loadingStates.products ? 'Complete' : 'Start'} Loading
            </NButton>
          </View>

          {loadingStates.products ? (
            <View className="gap-4">
              {[1, 2].map(i => (
                <View key={i} className="border border-border rounded-lg p-4">
                  <NSkeleton className="w-full h-32 rounded-lg mb-3" />
                  <NSkeleton className="w-3/4 h-5 mb-2" />
                  <NSkeleton className="w-1/2 h-4 mb-2" />
                  <View className="flex-row justify-between items-center">
                    <NSkeleton className="w-16 h-6" />
                    <NSkeleton className="w-20 h-8 rounded" />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="gap-4">
              {[
                { name: 'Wireless Headphones', price: '$99.99', image: '🎧' },
                { name: 'Smart Watch', price: '$299.99', image: '⌚' }
              ].map((product, i) => (
                <View key={i} className="border border-border rounded-lg p-4">
                  <View className="w-full h-32 rounded-lg bg-indigo-500 items-center justify-center mb-3">
                    <NText className="text-4xl">{product.image}</NText>
                  </View>
                  <NText className="text-lg font-semibold text-text mb-1">{product.name}</NText>
                  <NText className="text-muted mb-2">High-quality product with excellent reviews</NText>
                  <View className="flex-row justify-between items-center">
                    <NText className="text-xl font-bold text-green-600">{product.price}</NText>
                    <View className="px-4 py-2 bg-blue-500 rounded">
                      <NText className="text-white font-semibold">Add to Cart</NText>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </NCard>

        {/* Social Feed Loading */}
        <NCard className="mb-6 p-4">
          <View className="flex-row justify-between items-center mb-4">
            <NText className="text-lg font-semibold text-text">Social Feed Loading</NText>
            <NButton onPress={() => toggleLoading('social')} className="px-3 py-2 rounded-md border border-gray-300 bg-white">
              {loadingStates.social ? 'Complete' : 'Start'} Loading
            </NButton>
          </View>

          {loadingStates.social ? (
            <View className="gap-4">
              {[1, 2].map(i => (
                <View key={i} className="border border-border rounded-lg p-4">
                  <View className="flex-row items-center gap-3 mb-3">
                    <NSkeleton className="w-10 h-10 rounded-full" />
                    <View className="flex-1">
                      <NSkeleton className="w-1/3 h-4 mb-1" />
                      <NSkeleton className="w-1/4 h-3" />
                    </View>
                  </View>
                  <NSkeleton className="w-full h-4 mb-2" />
                  <NSkeleton className="w-2/3 h-4 mb-3" />
                  <NSkeleton className="w-full h-40 rounded-lg mb-3" />
                  <View className="flex-row gap-4">
                    <NSkeleton className="w-12 h-6 rounded" />
                    <NSkeleton className="w-16 h-6 rounded" />
                    <NSkeleton className="w-12 h-6 rounded" />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="gap-4">
              {[
                {
                  user: 'Sarah Wilson',
                  time: '2h ago',
                  content: 'Just finished an amazing hike! The views were incredible 🏔️',
                  avatar: 'SW',
                  image: '🏔️'
                },
                {
                  user: 'Mike Chen',
                  time: '4h ago',
                  content: 'Working on a new React Native project. Loving the developer experience!',
                  avatar: 'MC',
                  image: '💻'
                }
              ].map((post, i) => (
                <View key={i} className="border border-border rounded-lg p-4">
                  <View className="flex-row items-center gap-3 mb-3">
                    <View className="w-10 h-10 rounded-full bg-pink-500 items-center justify-center">
                      <NText className="text-white font-bold text-xs">{post.avatar}</NText>
                    </View>
                    <View className="flex-1">
                      <NText className="font-semibold text-text">{post.user}</NText>
                      <NText className="text-xs text-muted">{post.time}</NText>
                    </View>
                  </View>
                  <NText className="text-text mb-3">{post.content}</NText>
                  <View className="w-full h-40 rounded-lg bg-teal-500 items-center justify-center mb-3">
                    <NText className="text-6xl">{post.image}</NText>
                  </View>
                  <View className="flex-row gap-4">
                    <View className="px-3 py-1 bg-red-100 rounded">
                      <NText className="text-red-800 text-sm">❤️ Like</NText>
                    </View>
                    <View className="px-3 py-1 bg-blue-100 rounded">
                      <NText className="text-blue-800 text-sm">💬 Comment</NText>
                    </View>
                    <View className="px-3 py-1 bg-green-100 rounded">
                      <NText className="text-green-800 text-sm">↗️ Share</NText>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </NCard>

        {/* Settings Panel Loading */}
        <NCard className="mb-6 p-4">
          <View className="flex-row justify-between items-center mb-4">
            <NText className="text-lg font-semibold text-text">Settings Panel Loading</NText>
            <NButton onPress={() => toggleLoading('settings')} className="px-3 py-2 rounded-md border border-gray-300 bg-white">
              {loadingStates.settings ? 'Complete' : 'Start'} Loading
            </NButton>
          </View>

          {loadingStates.settings ? (
            <View className="gap-4">
              {[1, 2, 3, 4].map(i => (
                <View key={i} className="flex-row items-center justify-between py-3 border-b border-border">
                  <View className="flex-row items-center gap-3">
                    <NSkeleton className="w-6 h-6 rounded" />
                    <View>
                      <NSkeleton className="w-24 h-4 mb-1" />
                      <NSkeleton className="w-32 h-3" />
                    </View>
                  </View>
                  <NSkeleton className="w-12 h-6 rounded-full" />
                </View>
              ))}
            </View>
          ) : (
            <View className="gap-4">
              {[
                { icon: '🔔', title: 'Notifications', desc: 'Push notifications and alerts', enabled: true },
                { icon: '🌙', title: 'Dark Mode', desc: 'Switch to dark theme', enabled: false },
                { icon: '🔒', title: 'Privacy', desc: 'Data and privacy settings', enabled: true },
                { icon: '🌐', title: 'Language', desc: 'App language preferences', enabled: false }
              ].map((setting, i) => (
                <View key={i} className="flex-row items-center justify-between py-3 border-b border-border">
                  <View className="flex-row items-center gap-3">
                    <NText className="text-xl">{setting.icon}</NText>
                    <View>
                      <NText className="font-semibold text-text">{setting.title}</NText>
                      <NText className="text-sm text-muted">{setting.desc}</NText>
                    </View>
                  </View>
                  <View className={`w-12 h-6 rounded-full ${setting.enabled ? 'bg-blue-500' : 'bg-gray-300'} items-center justify-center`}>
                    <View className={`w-4 h-4 rounded-full bg-white ${setting.enabled ? 'ml-2' : '-ml-2'}`} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </NCard>

        {/* Loading History */}
        <NCard className="mb-6 p-4 bg-gray-50 border-gray-200">
          <NText className="text-lg font-semibold text-gray-800 mb-3">Loading History</NText>
          {loadingHistory.length > 0 ? (
            <View className="gap-1">
              {loadingHistory.slice(-5).map((action, index) => (
                <NText key={index} className="text-sm text-gray-600">
                  • {action}
                </NText>
              ))}
              {loadingHistory.length > 5 && <NText className="text-xs text-gray-500 mt-1">... and {loadingHistory.length - 5} more actions</NText>}
            </View>
          ) : (
            <NText className="text-sm text-gray-500 italic">No loading actions yet</NText>
          )}
        </NCard>

        {/* Best Practices */}
        <NCard className="mb-6 p-4 bg-green-50 border-green-200">
          <NText className="text-lg font-semibold text-green-800 mb-3">Skeleton Loading Best Practices</NText>
          <View className="gap-2">
            <NText className="text-sm text-green-700">✅ Match the shape and size of actual content</NText>
            <NText className="text-sm text-green-700">✅ Use consistent spacing and alignment</NText>
            <NText className="text-sm text-green-700">✅ Animate skeletons to show loading progress</NText>
            <NText className="text-sm text-green-700">✅ Show skeletons for 1-3 seconds maximum</NText>
            <NText className="text-sm text-green-700">✅ Use different skeleton patterns for different content types</NText>
            <NText className="text-sm text-green-700">✅ Provide visual hierarchy with varying skeleton sizes</NText>
            <NText className="text-sm text-red-700 mt-2">❌ Don't use generic rectangles for all content</NText>
            <NText className="text-sm text-red-700">❌ Don't show skeletons for too long</NText>
            <NText className="text-sm text-red-700">❌ Don't use skeletons for instant content</NText>
          </View>
        </NCard>
      </View>
    </ScrollView>
  );
};

export default Component;
