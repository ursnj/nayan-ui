import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NButton, NText, useNToast } from '@nayan-ui/react-native';
import { Download, Edit, Heart, Mail, Phone, Plus, Save, Settings, Share, Trash2 } from 'lucide-react-native';

const Component = () => {
  const toast = useNToast();
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useState(false);

  const handleAsyncAction = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    toast.success('Action completed!');
  };

  return (
    <ScrollView className="flex-1 bg-surface p-4">
      {/* Basic Buttons */}
      <NText className="text-lg font-semibold mb-3 text-foreground">Basic Buttons</NText>
      <View className="flex-row flex-wrap gap-2 mb-6">
        <NButton onPress={() => toast.info('Primary button pressed')}>Primary</NButton>
        <NButton
          className="bg-secondary border-secondary"
          textClassName="text-secondary-foreground"
          onPress={() => toast.info('Secondary button pressed')}>
          Secondary
        </NButton>
        <NButton className="bg-transparent border-separator" textClassName="text-foreground" onPress={() => toast.info('Outline button pressed')}>
          Outline
        </NButton>
      </View>

      {/* Buttons with Icons */}
      <NText className="text-lg font-semibold mb-3 text-foreground">Buttons with Icons</NText>
      <View className="flex-row flex-wrap gap-2 mb-6">
        <NButton
          icon={Heart}
          onPress={() => {
            setLiked(!liked);
            toast.success(liked ? 'Unliked!' : 'Liked!');
          }}
          className={liked ? 'bg-red-500 border-red-500' : undefined}>
          {liked ? 'Liked' : 'Like'}
        </NButton>
        <NButton icon={Download} onPress={() => toast.info('Downloading...')}>
          Download
        </NButton>
        <NButton icon={Settings} onPress={() => toast.info('Opening settings...')}>
          Settings
        </NButton>
        <NButton icon={Plus} className="bg-green-500 border-green-500">
          Add New
        </NButton>
      </View>

      {/* Button States */}
      <NText className="text-lg font-semibold mb-3 text-foreground">Button States</NText>
      <View className="flex-row flex-wrap gap-2 mb-6">
        <NButton disabled>Disabled</NButton>
        <NButton onPress={handleAsyncAction} disabled={loading} className={loading ? 'opacity-70' : undefined}>
          {loading ? 'Loading...' : 'Async Action'}
        </NButton>
        <NButton className="bg-yellow-500 border-yellow-500" textClassName="text-black" onPress={() => toast.warning('Warning action!')}>
          Warning
        </NButton>
        <NButton className="bg-red-500 border-red-500" onPress={() => toast.error('Danger action!')}>
          Danger
        </NButton>
      </View>

      {/* Different Sizes */}
      <NText className="text-lg font-semibold mb-3 text-foreground">Different Sizes</NText>
      <View className="gap-2 mb-6">
        <NButton className="px-3 py-2" textClassName="text-sm" onPress={() => toast.info('Small button')}>
          Small Button
        </NButton>
        <NButton onPress={() => toast.info('Medium button')}>Medium Button (Default)</NButton>
        <NButton className="px-6 py-4" textClassName="text-lg" onPress={() => toast.info('Large button')}>
          Large Button
        </NButton>
      </View>

      {/* Action Buttons */}
      <NText className="text-lg font-semibold mb-3 text-foreground">Action Buttons</NText>
      <View className="flex-row flex-wrap gap-2 mb-6">
        <NButton icon={Edit} className="bg-blue-500 border-blue-500" onPress={() => toast.info('Edit mode activated')}>
          Edit
        </NButton>
        <NButton icon={Save} className="bg-green-600 border-green-600" onPress={() => toast.success('Saved successfully!')}>
          Save
        </NButton>
        <NButton icon={Trash2} className="bg-red-600 border-red-600" onPress={() => toast.error('Deleted!')}>
          Delete
        </NButton>
      </View>

      {/* Contact Buttons */}
      <NText className="text-lg font-semibold mb-3 text-foreground">Contact Actions</NText>
      <View className="flex-row flex-wrap gap-2 mb-6">
        <NButton icon={Mail} className="bg-indigo-500 border-indigo-500" onPress={() => toast.info('Opening email...')}>
          Email
        </NButton>
        <NButton icon={Phone} className="bg-green-500 border-green-500" onPress={() => toast.info('Making call...')}>
          Call
        </NButton>
        <NButton icon={Share} className="bg-purple-500 border-purple-500" onPress={() => toast.info('Sharing...')}>
          Share
        </NButton>
      </View>

      {/* Custom Styled Buttons */}
      <NText className="text-lg font-semibold mb-3 text-foreground">Custom Styled</NText>
      <View className="gap-2 mb-6">
        <NButton
          className="bg-gradient-to-r from-purple-500 to-pink-500 border-0 rounded-full"
          textClassName="text-white font-bold"
          onPress={() => toast.success('Gradient button!')}>
          Gradient Button
        </NButton>
        <NButton
          className="bg-transparent border-2 border-dashed border-primary rounded-lg"
          textClassName="text-primary"
          onPress={() => toast.info('Dashed border button!')}>
          Dashed Border
        </NButton>
        <NButton
          className="bg-black border-black rounded-none"
          textClassName="text-white uppercase tracking-wider"
          onPress={() => toast.info('Minimal button!')}>
          Minimal
        </NButton>
      </View>

      {/* Full Width Button */}
      <NText className="text-lg font-semibold mb-3 text-foreground">Full Width</NText>
      <NButton className="w-full mb-4" onPress={() => toast.success('Full width button pressed!')}>
        Full Width Button
      </NButton>
    </ScrollView>
  );
};

export default Component;
