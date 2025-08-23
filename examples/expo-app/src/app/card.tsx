import React, { useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { NButton, NCard, NPress, NText, NToast } from '@nayan-ui/react-native';
import { Calendar, ChevronRight, Heart, MapPin, MessageCircle, Settings, Share, Star, User } from 'lucide-react-native';

const Component = () => {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [rating, setRating] = useState(4);

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Basic Card */}
      <NText className="text-xl font-bold mb-3 text-text">Basic Card</NText>
      <NCard className="mb-6">
        <NText className="text-lg font-semibold mb-2 text-text">Simple Card</NText>
        <NText className="text-muted">This is a basic card with some text content. Cards are great for grouping related information.</NText>
      </NCard>

      {/* Profile Card */}
      <NText className="text-xl font-bold mb-3 text-text">Profile Card</NText>
      <NCard className="mb-6">
        <View className="flex-row items-center mb-4">
          <View className="w-16 h-16 bg-blue-500 rounded-full items-center justify-center mr-4">
            <User size={32} color="white" />
          </View>
          <View className="flex-1">
            <NText className="text-lg font-bold text-text">John Doe</NText>
            <NText className="text-muted">Software Developer</NText>
            <View className="flex-row items-center mt-1">
              <MapPin size={14} color="#666" />
              <NText className="text-sm text-muted ml-1">San Francisco, CA</NText>
            </View>
          </View>
          <NButton className="bg-blue-500 border-blue-500 px-4 py-2" onPress={() => NToast.success('Following John!')}>
            Follow
          </NButton>
        </View>
        <NText className="text-muted text-sm">
          Passionate about creating beautiful and functional mobile applications. Love working with React Native and exploring new technologies.
        </NText>
      </NCard>

      {/* Product Card */}
      <NText className="text-xl font-bold mb-3 text-text">Product Card</NText>
      <NCard className="mb-6">
        <View className="w-full h-40 bg-gray-200 rounded-lg mb-4 items-center justify-center">
          <NText className="text-gray-500">Product Image</NText>
        </View>
        <NText className="text-lg font-bold text-text mb-2">Wireless Headphones</NText>
        <View className="flex-row items-center mb-2">
          {[1, 2, 3, 4, 5].map(star => (
            <Star key={star} size={16} color={star <= rating ? '#fbbf24' : '#d1d5db'} fill={star <= rating ? '#fbbf24' : 'none'} />
          ))}
          <NText className="text-sm text-muted ml-2">(128 reviews)</NText>
        </View>
        <NText className="text-muted mb-4">Premium wireless headphones with noise cancellation and 30-hour battery life.</NText>
        <View className="flex-row items-center justify-between">
          <NText className="text-2xl font-bold text-primary">$199.99</NText>
          <NButton className="bg-primary border-primary" onPress={() => NToast.success('Added to cart!')}>
            Add to Cart
          </NButton>
        </View>
      </NCard>

      {/* Social Media Card */}
      <NText className="text-xl font-bold mb-3 text-text">Social Media Post</NText>
      <NCard className="mb-6">
        <View className="flex-row items-center mb-3">
          <View className="w-10 h-10 bg-green-500 rounded-full items-center justify-center mr-3">
            <User size={20} color="white" />
          </View>
          <View className="flex-1">
            <NText className="font-semibold text-text">Sarah Wilson</NText>
            <NText className="text-sm text-muted">2 hours ago</NText>
          </View>
        </View>
        <NText className="text-text mb-4">
          Just finished an amazing hike in the mountains! The view was absolutely breathtaking. Nature never fails to inspire me. 🏔️ #hiking #nature
          #adventure
        </NText>
        <View className="w-full h-48 bg-green-100 rounded-lg mb-4 items-center justify-center">
          <NText className="text-green-600">Mountain View Photo</NText>
        </View>
        <View className="flex-row items-center justify-between border-t border-border pt-3">
          <NPress
            className="flex-row items-center"
            onPress={() => {
              setLiked(!liked);
              NToast.success(liked ? 'Unliked' : 'Liked!');
            }}>
            <Heart size={20} color={liked ? '#ef4444' : '#666'} fill={liked ? '#ef4444' : 'none'} />
            <NText className="ml-2 text-muted">24</NText>
          </NPress>
          <NPress className="flex-row items-center" onPress={() => NToast.info('Opening comments')}>
            <MessageCircle size={20} color="#666" />
            <NText className="ml-2 text-muted">8</NText>
          </NPress>
          <NPress className="flex-row items-center" onPress={() => NToast.info('Sharing post')}>
            <Share size={20} color="#666" />
            <NText className="ml-2 text-muted">Share</NText>
          </NPress>
        </View>
      </NCard>

      {/* Event Card */}
      <NText className="text-xl font-bold mb-3 text-text">Event Card</NText>
      <NCard className="mb-6">
        <View className="flex-row mb-4">
          <View className="w-16 h-16 bg-red-500 rounded-lg items-center justify-center mr-4">
            <Calendar size={24} color="white" />
          </View>
          <View className="flex-1">
            <NText className="text-lg font-bold text-text">React Native Conference</NText>
            <NText className="text-muted">March 15, 2024 • 9:00 AM</NText>
            <View className="flex-row items-center mt-1">
              <MapPin size={14} color="#666" />
              <NText className="text-sm text-muted ml-1">Convention Center, NYC</NText>
            </View>
          </View>
        </View>
        <NText className="text-muted mb-4">
          Join us for a day of learning about the latest in React Native development, networking with fellow developers, and exploring new tools and
          techniques.
        </NText>
        <View className="flex-row gap-2">
          <NButton className="flex-1 bg-red-500 border-red-500" onPress={() => NToast.success('Registered for event!')}>
            Register
          </NButton>
          <NButton className="flex-1 bg-transparent border-border" textClassName="text-text" onPress={() => NToast.info('Event details opened')}>
            Learn More
          </NButton>
        </View>
      </NCard>

      {/* Stats Card */}
      <NText className="text-xl font-bold mb-3 text-text">Statistics Card</NText>
      <NCard className="mb-6">
        <NText className="text-lg font-bold text-text mb-4">App Performance</NText>
        <View className="flex-row justify-between">
          <View className="items-center flex-1">
            <NText className="text-2xl font-bold text-blue-500">1.2K</NText>
            <NText className="text-sm text-muted">Downloads</NText>
          </View>
          <View className="items-center flex-1">
            <NText className="text-2xl font-bold text-green-500">4.8</NText>
            <NText className="text-sm text-muted">Rating</NText>
          </View>
          <View className="items-center flex-1">
            <NText className="text-2xl font-bold text-purple-500">95%</NText>
            <NText className="text-sm text-muted">Uptime</NText>
          </View>
        </View>
      </NCard>

      {/* Settings Card */}
      <NText className="text-xl font-bold mb-3 text-text">Settings Card</NText>
      <NCard className="mb-6">
        <NText className="text-lg font-bold text-text mb-4">Account Settings</NText>

        <NPress className="flex-row items-center justify-between py-3 border-b border-border" onPress={() => NToast.info('Profile settings')}>
          <View className="flex-row items-center">
            <User size={20} color="#666" />
            <NText className="ml-3 text-text">Profile Information</NText>
          </View>
          <ChevronRight size={20} color="#666" />
        </NPress>

        <NPress className="flex-row items-center justify-between py-3 border-b border-border" onPress={() => NToast.info('Privacy settings')}>
          <View className="flex-row items-center">
            <Settings size={20} color="#666" />
            <NText className="ml-3 text-text">Privacy & Security</NText>
          </View>
          <ChevronRight size={20} color="#666" />
        </NPress>

        <NPress className="flex-row items-center justify-between py-3" onPress={() => NToast.info('Notification settings')}>
          <View className="flex-row items-center">
            <MessageCircle size={20} color="#666" />
            <NText className="ml-3 text-text">Notifications</NText>
          </View>
          <ChevronRight size={20} color="#666" />
        </NPress>
      </NCard>

      {/* Custom Styled Cards */}
      <NText className="text-xl font-bold mb-3 text-text">Custom Styled Cards</NText>

      {/* Gradient Card */}
      <NCard className="mb-4 bg-gradient-to-r from-blue-500 to-purple-600 border-0">
        <NText className="text-white text-lg font-bold mb-2">Premium Feature</NText>
        <NText className="text-blue-100 mb-4">
          Unlock advanced features with our premium subscription. Get access to exclusive content and priority support.
        </NText>
        <NButton
          className="bg-white border-white self-start"
          textClassName="text-blue-600 font-semibold"
          onPress={() => NToast.info('Upgrade to premium')}>
          Upgrade Now
        </NButton>
      </NCard>

      {/* Dark Card */}
      <NCard className="mb-4 bg-gray-800 border-gray-700">
        <NText className="text-white text-lg font-bold mb-2">Dark Mode Card</NText>
        <NText className="text-gray-300 mb-4">
          This card demonstrates how components look in dark mode. Perfect for night-time usage or users who prefer dark themes.
        </NText>
        <NButton className="bg-blue-600 border-blue-600" onPress={() => NToast.info('Dark mode action')}>
          Action
        </NButton>
      </NCard>

      {/* Minimal Card */}
      <NCard className="mb-6 border-0 shadow-none bg-transparent">
        <NText className="text-lg font-bold text-text mb-2">Minimal Card</NText>
        <NText className="text-muted">Sometimes less is more. This card has no border or shadow for a clean, minimal appearance.</NText>
      </NCard>

      {/* Help Section */}
      <View className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <NText className="text-blue-800 font-semibold mb-2">💡 Card Design Tips</NText>
        <NText className="text-blue-700 text-sm leading-relaxed">
          • Use cards to group related content and actions{'\n'}• Keep card content focused and avoid overcrowding{'\n'}• Use consistent spacing and
          typography within cards{'\n'}• Consider using shadows and borders to create visual hierarchy{'\n'}• Make interactive elements clearly
          clickable{'\n'}• Test cards on different screen sizes for responsiveness{'\n'}• Use appropriate contrast ratios for accessibility
        </NText>
      </View>
    </ScrollView>
  );
};

export default Component;
