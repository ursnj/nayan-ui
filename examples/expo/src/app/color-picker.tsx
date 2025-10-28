import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NButton, NCard, NColorPicker, NText, NToast } from '@nayan-ui/react-native';

const Component = () => {
  // Basic color states
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#10b981');
  const [accentColor, setAccentColor] = useState('#f59e0b');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');

  // Theme colors
  const [themeColors, setThemeColors] = useState({
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  });

  // Brand colors
  const [brandColors, setBrandColors] = useState({
    logo: '#1e40af',
    header: '#1f2937',
    sidebar: '#374151',
    button: '#059669',
    link: '#2563eb'
  });

  // UI customization
  const [uiColors, setUiColors] = useState({
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    border: '#d1d5db',
    background: '#f9fafb',
    surface: '#ffffff'
  });

  // Preset color palettes
  const colorPresets = {
    modern: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'],
    pastel: ['#fecaca', '#fed7d7', '#fef3c7', '#d1fae5', '#dbeafe', '#e0e7ff'],
    dark: ['#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db'],
    vibrant: ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#2563eb', '#7c3aed'],
    earth: ['#92400e', '#b45309', '#a16207', '#365314', '#166534', '#1e40af'],
    ocean: ['#0c4a6e', '#075985', '#0369a1', '#0284c7', '#0ea5e9', '#38bdf8']
  };

  const handleThemeColorChange = (key: string, color: string) => {
    setThemeColors(prev => ({ ...prev, [key]: color }));
    NToast.success(`${key} color updated!`);
  };

  const handleBrandColorChange = (key: string, color: string) => {
    setBrandColors(prev => ({ ...prev, [key]: color }));
    NToast.success(`${key} color updated!`);
  };

  const handleUIColorChange = (key: string, color: string) => {
    setUiColors(prev => ({ ...prev, [key]: color }));
    NToast.success(`${key} color updated!`);
  };

  const applyPreset = (presetName: string, colors: string[]) => {
    setThemeColors({
      primary: colors[0],
      secondary: colors[1],
      success: colors[4],
      warning: colors[3],
      error: colors[2],
      info: colors[5]
    });
    NToast.success(`${presetName} preset applied!`);
  };

  const resetColors = () => {
    setPrimaryColor('#3b82f6');
    setSecondaryColor('#10b981');
    setAccentColor('#f59e0b');
    setBackgroundColor('#ffffff');
    setThemeColors({
      primary: '#6366f1',
      secondary: '#8b5cf6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    });
    NToast.success('Colors reset to defaults!');
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Basic Color Pickers */}
      <NText className="text-xl font-bold mb-3 text-text">Basic Color Pickers</NText>

      <NCard className="p-4 mb-6">
        <View className="space-y-4">
          <NColorPicker label="Primary Color" value={primaryColor} onChange={setPrimaryColor} className="mb-2" />

          <NColorPicker label="Secondary Color" value={secondaryColor} onChange={setSecondaryColor} className="mb-2" />

          <NColorPicker label="Accent Color" value={accentColor} onChange={setAccentColor} className="mb-2" />

          <NColorPicker label="Background Color" value={backgroundColor} onChange={setBackgroundColor} className="mb-2" />
        </View>

        {/* Color Preview */}
        <View className="mt-4 p-4 rounded-lg border border-gray-200">
          <NText className="text-text font-semibold mb-3">Color Preview</NText>
          <View className="flex-row gap-2 flex-wrap">
            <View className="items-center">
              <View className="w-12 h-12 rounded-lg border border-gray-300" style={{ backgroundColor: primaryColor }} />
              <NText className="text-xs mt-1 text-muted">Primary</NText>
            </View>
            <View className="items-center">
              <View className="w-12 h-12 rounded-lg border border-gray-300" style={{ backgroundColor: secondaryColor }} />
              <NText className="text-xs mt-1 text-muted">Secondary</NText>
            </View>
            <View className="items-center">
              <View className="w-12 h-12 rounded-lg border border-gray-300" style={{ backgroundColor: accentColor }} />
              <NText className="text-xs mt-1 text-muted">Accent</NText>
            </View>
            <View className="items-center">
              <View className="w-12 h-12 rounded-lg border border-gray-300" style={{ backgroundColor: backgroundColor }} />
              <NText className="text-xs mt-1 text-muted">Background</NText>
            </View>
          </View>
        </View>
      </NCard>

      {/* Theme Colors */}
      <NText className="text-xl font-bold mb-3 text-text">Theme Colors</NText>

      <NCard className="p-4 mb-6">
        <NText className="text-text font-semibold mb-4">🎨 Application Theme</NText>

        <View className="space-y-3">
          {Object.entries(themeColors).map(([key, color]) => (
            <NColorPicker
              key={key}
              label={key.charAt(0).toUpperCase() + key.slice(1)}
              value={color}
              onChange={newColor => handleThemeColorChange(key, newColor)}
              className="mb-1"
            />
          ))}
        </View>

        {/* Theme Preview */}
        <View className="mt-4 p-4 rounded-lg" style={{ backgroundColor: themeColors.primary + '10' }}>
          <NText className="font-semibold mb-3" style={{ color: themeColors.primary }}>
            Theme Preview
          </NText>
          <View className="flex-row gap-2 flex-wrap">
            {Object.entries(themeColors).map(([key, color]) => (
              <View key={key} className="items-center">
                <View className="w-10 h-10 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
                <NText className="text-xs mt-1 capitalize text-muted">{key}</NText>
              </View>
            ))}
          </View>
        </View>
      </NCard>

      {/* Brand Colors */}
      <NText className="text-xl font-bold mb-3 text-text">Brand Colors</NText>

      <NCard className="p-4 mb-6">
        <NText className="text-text font-semibold mb-4">🏢 Brand Identity</NText>

        <View className="space-y-3">
          {Object.entries(brandColors).map(([key, color]) => (
            <NColorPicker
              key={key}
              label={key.charAt(0).toUpperCase() + key.slice(1)}
              value={color}
              onChange={newColor => handleBrandColorChange(key, newColor)}
              className="mb-1"
            />
          ))}
        </View>

        {/* Brand Preview */}
        <View className="mt-4 p-4 rounded-lg border border-gray-200">
          <NText className="text-text font-semibold mb-3">Brand Color Palette</NText>
          <View className="flex-row gap-3 flex-wrap">
            {Object.entries(brandColors).map(([key, color]) => (
              <View key={key} className="items-center">
                <View className="w-14 h-14 rounded-lg shadow-sm" style={{ backgroundColor: color }} />
                <NText className="text-xs mt-2 capitalize font-medium text-text">{key}</NText>
                <NText className="text-xs text-muted">{color}</NText>
              </View>
            ))}
          </View>
        </View>
      </NCard>

      {/* UI Customization */}
      <NText className="text-xl font-bold mb-3 text-text">UI Customization</NText>

      <NCard className="p-4 mb-6">
        <NText className="text-text font-semibold mb-4">⚙️ Interface Colors</NText>

        <View className="space-y-3">
          {Object.entries(uiColors).map(([key, color]) => (
            <NColorPicker
              key={key}
              label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              value={color}
              onChange={newColor => handleUIColorChange(key, newColor)}
              className="mb-1"
            />
          ))}
        </View>

        {/* UI Preview */}
        <View className="mt-4 p-4 rounded-lg" style={{ backgroundColor: uiColors.background }}>
          <View className="p-4 rounded-lg" style={{ backgroundColor: uiColors.surface }}>
            <NText className="font-bold mb-2" style={{ color: uiColors.textPrimary }}>
              Sample UI Element
            </NText>
            <NText className="text-sm mb-3" style={{ color: uiColors.textSecondary }}>
              This preview shows how your UI colors work together in a real interface.
            </NText>
            <View className="p-3 rounded border" style={{ borderColor: uiColors.border, backgroundColor: uiColors.background }}>
              <NText className="text-sm" style={{ color: uiColors.textPrimary }}>
                Content area with custom colors
              </NText>
            </View>
          </View>
        </View>
      </NCard>

      {/* Color Presets */}
      <NText className="text-xl font-bold mb-3 text-text">Color Presets</NText>

      <NCard className="p-4 mb-6">
        <NText className="text-text font-semibold mb-4">🎭 Quick Color Schemes</NText>

        <View className="space-y-4">
          {Object.entries(colorPresets).map(([presetName, colors]) => (
            <View key={presetName} className="p-3 rounded-lg border border-gray-200">
              <View className="flex-row items-center justify-between mb-3">
                <NText className="text-text font-medium capitalize">{presetName} Palette</NText>
                <NButton className="bg-blue-500 border-blue-500 px-3 py-1" onPress={() => applyPreset(presetName, colors)}>
                  <NText className="text-white text-xs">Apply</NText>
                </NButton>
              </View>
              <View className="flex-row gap-2">
                {colors.map((color, index) => (
                  <View key={index} className="w-8 h-8 rounded border border-gray-300" style={{ backgroundColor: color }} />
                ))}
              </View>
            </View>
          ))}
        </View>
      </NCard>

      {/* Disabled State Example */}
      <NText className="text-xl font-bold mb-3 text-text">Disabled State</NText>

      <NCard className="p-4 mb-6">
        <NText className="text-text font-semibold mb-4">🚫 Disabled Color Picker</NText>

        <NColorPicker label="Disabled Color Picker" value="#cccccc" onChange={() => {}} disabled={true} className="mb-3" />

        <NText className="text-muted text-sm">
          This color picker is disabled and cannot be interacted with. Useful for read-only scenarios or when certain conditions aren't met.
        </NText>
      </NCard>

      {/* Action Buttons */}
      <View className="flex-row gap-3 mb-4">
        <NButton className="flex-1 bg-green-500 border-green-500" onPress={() => NToast.success('Colors saved!')}>
          <NText className="text-white">Save Colors</NText>
        </NButton>
        <NButton className="flex-1 bg-gray-500 border-gray-500" onPress={resetColors}>
          <NText className="text-white">Reset All</NText>
        </NButton>
      </View>

      {/* Best Practices */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3">💡 Color Picker Best Practices</NText>
        <View className="space-y-2">
          <NText className="text-sm text-muted">• Use consistent color schemes across your application</NText>
          <NText className="text-sm text-muted">• Consider accessibility and contrast ratios when choosing colors</NText>
          <NText className="text-sm text-muted">• Provide color presets for common use cases</NText>
          <NText className="text-sm text-muted">• Show real-time previews of color changes</NText>
          <NText className="text-sm text-muted">• Use descriptive labels for different color purposes</NText>
          <NText className="text-sm text-muted">• Consider color blindness when designing color schemes</NText>
          <NText className="text-sm text-muted">• Provide reset functionality for easy color management</NText>
          <NText className="text-sm text-muted">• Group related colors together for better organization</NText>
        </View>
      </NCard>
    </ScrollView>
  );
};

export default Component;
