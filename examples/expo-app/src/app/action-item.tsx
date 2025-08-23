import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NActionItem, NCard, NText, NToast, useNTheme } from '@nayan-ui/react-native';

const Component = () => {
  const { colors } = useNTheme();
  const [actionHistory, setActionHistory] = useState<Array<{ action: string; timestamp: string }>>([]);
  const [notificationCount, setNotificationCount] = useState(3);
  const [isOnline, setIsOnline] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);

  const addToHistory = (action: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActionHistory(prev => [...prev, { action, timestamp }]);
  };

  const handleNotificationPress = () => {
    setNotificationCount(0);
    addToHistory('Viewed notifications');
    NToast.success('All notifications marked as read');
  };

  const handleSettingsPress = () => {
    addToHistory('Opened settings');
    NToast.info('Opening settings...');
  };

  const handleProfilePress = () => {
    addToHistory('Viewed profile');
    NToast.info('Opening profile...');
  };

  const handleLocationToggle = () => {
    const newState = !isLocationEnabled;
    setIsLocationEnabled(newState);
    addToHistory(`Location ${newState ? 'enabled' : 'disabled'}`);
    NToast.success(`Location ${newState ? 'enabled' : 'disabled'}`);
  };

  const handleThemeToggle = () => {
    const newState = !isDarkMode;
    setIsDarkMode(newState);
    addToHistory(`Switched to ${newState ? 'dark' : 'light'} mode`);
    NToast.success(`${newState ? 'Dark' : 'Light'} mode activated`);
  };

  const handleConnectionToggle = () => {
    const newState = !isOnline;
    setIsOnline(newState);
    addToHistory(`${newState ? 'Connected' : 'Disconnected'}`);
    NToast.success(newState ? 'Connected to network' : 'Disconnected from network');
  };

  const resetAll = () => {
    setActionHistory([]);
    setNotificationCount(3);
    setIsOnline(true);
    setIsDarkMode(false);
    setIsLocationEnabled(false);
    NToast.success('All settings reset');
  };

  return (
    <ScrollView className="flex-1 p-4 bg-background">
      {/* Basic Action Items */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3">Basic Action Items</NText>

        <NActionItem
          className="rounded-lg border border-border mb-3 bg-card"
          name="Default Action Item"
          description="Simple action item with icon and description"
          icon={<Ionicons name="flag" size={20} color={colors.primary} />}
          onPress={() => {
            addToHistory('Basic action triggered');
            NToast.success('Default action executed');
          }}
        />

        <NActionItem
          className="rounded-lg border border-green-500 bg-green-50 mb-3"
          titleClassName="text-green-700 font-medium"
          descriptionClassName="text-green-600"
          name="Success Action"
          description="Action item with success styling"
          icon={<Ionicons name="checkmark-circle" size={20} color="#16a34a" />}
          onPress={() => {
            addToHistory('Success action triggered');
            NToast.success('Success action completed');
          }}
        />

        <NActionItem
          className="rounded-lg border border-red-500 bg-red-50"
          titleClassName="text-red-700 font-medium"
          descriptionClassName="text-red-600"
          name="Delete Action"
          description="Destructive action with warning styling"
          icon={<Ionicons name="trash" size={20} color="#dc2626" />}
          onPress={() => {
            addToHistory('Delete action triggered');
            NToast.error('Delete action executed');
          }}
        />
      </NCard>

      {/* User Profile Actions */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3">User Profile Actions</NText>

        <NActionItem
          className="rounded-lg border border-border mb-3 bg-card"
          name="View Profile"
          description="See your profile details and statistics"
          icon={<Ionicons name="person" size={20} color={colors.primary} />}
          onPress={handleProfilePress}
        />

        <NActionItem
          className="rounded-lg border border-border mb-3 bg-card"
          name="Edit Profile"
          description="Update your personal information"
          icon={<Ionicons name="create" size={20} color={colors.primary} />}
          onPress={() => {
            addToHistory('Profile edit started');
            NToast.info('Opening profile editor...');
          }}
        />

        <NActionItem
          className="rounded-lg border border-border bg-card"
          name="Account Settings"
          description="Manage your account preferences"
          icon={<Ionicons name="settings" size={20} color={colors.primary} />}
          onPress={handleSettingsPress}
        />
      </NCard>

      {/* Notification Actions */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3">Notifications & Communication</NText>

        <NActionItem
          className="rounded-lg border border-border mb-3 bg-card"
          name={`Notifications ${notificationCount > 0 ? `(${notificationCount})` : ''}`}
          description={notificationCount > 0 ? `You have ${notificationCount} unread notifications` : 'No new notifications'}
          icon={
            <Ionicons
              name={notificationCount > 0 ? 'notifications' : 'notifications-off'}
              size={20}
              color={notificationCount > 0 ? '#f59e0b' : colors.primary}
            />
          }
          onPress={handleNotificationPress}
        />

        <NActionItem
          className="rounded-lg border border-border mb-3 bg-card"
          name="Messages"
          description="View your recent messages and conversations"
          icon={<Ionicons name="chatbubbles" size={20} color={colors.primary} />}
          onPress={() => {
            addToHistory('Messages opened');
            NToast.info('Opening messages...');
          }}
        />

        <NActionItem
          className="rounded-lg border border-border bg-card"
          name="Email"
          description="Check your email inbox"
          icon={<Ionicons name="mail" size={20} color={colors.primary} />}
          onPress={() => {
            addToHistory('Email opened');
            NToast.info('Opening email...');
          }}
        />
      </NCard>

      {/* System Actions */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3">System Controls</NText>

        <NActionItem
          className="rounded-lg border border-border mb-3 bg-card"
          name={`Network Status: ${isOnline ? 'Online' : 'Offline'}`}
          description={isOnline ? 'Connected to network' : 'No network connection'}
          icon={<Ionicons name={isOnline ? 'wifi' : 'wifi-outline'} size={20} color={isOnline ? '#16a34a' : '#dc2626'} />}
          onPress={handleConnectionToggle}
        />

        <NActionItem
          className="rounded-lg border border-border mb-3 bg-card"
          name={`Theme: ${isDarkMode ? 'Dark Mode' : 'Light Mode'}`}
          description={`Currently using ${isDarkMode ? 'dark' : 'light'} theme`}
          icon={<Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={20} color={colors.primary} />}
          onPress={handleThemeToggle}
        />

        <NActionItem
          className="rounded-lg border border-border bg-card"
          name={`Location: ${isLocationEnabled ? 'Enabled' : 'Disabled'}`}
          description={isLocationEnabled ? 'Location services are active' : 'Location services are off'}
          icon={<Ionicons name={isLocationEnabled ? 'location' : 'location-outline'} size={20} color={isLocationEnabled ? '#16a34a' : '#6b7280'} />}
          onPress={handleLocationToggle}
        />
      </NCard>

      {/* File & Media Actions */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3">File & Media Actions</NText>

        <NActionItem
          className="rounded-lg border border-border mb-3 bg-card"
          name="Upload Photo"
          description="Add photos from your gallery"
          icon={<Ionicons name="camera" size={20} color={colors.primary} />}
          onPress={() => {
            addToHistory('Photo upload started');
            NToast.info('Opening camera...');
          }}
        />

        <NActionItem
          className="rounded-lg border border-border mb-3 bg-card"
          name="Download Files"
          description="Download your recent files"
          icon={<Ionicons name="download" size={20} color={colors.primary} />}
          onPress={() => {
            addToHistory('File download started');
            NToast.info('Starting download...');
          }}
        />

        <NActionItem
          className="rounded-lg border border-border bg-card"
          name="Share Content"
          description="Share files and media with others"
          icon={<Ionicons name="share" size={20} color={colors.primary} />}
          onPress={() => {
            addToHistory('Share dialog opened');
            NToast.info('Opening share options...');
          }}
        />
      </NCard>

      {/* Long Press Actions */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3">Long Press Actions</NText>
        <NText className="text-sm text-muted-foreground mb-3">These items support both tap and long press</NText>

        <NActionItem
          className="rounded-lg border border-border mb-3 bg-card"
          name="Quick Action"
          description="Tap for quick action, long press for menu"
          icon={<Ionicons name="flash" size={20} color={colors.primary} />}
          onPress={() => {
            addToHistory('Quick action (tap)');
            NToast.success('Quick action executed');
          }}
          onLongPress={() => {
            addToHistory('Quick action (long press)');
            NToast.info('Long press menu opened');
          }}
        />

        <NActionItem
          className="rounded-lg border border-border bg-card"
          name="Context Menu"
          description="Tap to select, long press for context menu"
          icon={<Ionicons name="ellipsis-horizontal" size={20} color={colors.primary} />}
          onPress={() => {
            addToHistory('Item selected (tap)');
            NToast.success('Item selected');
          }}
          onLongPress={() => {
            addToHistory('Context menu (long press)');
            NToast.info('Context menu opened');
          }}
        />
      </NCard>

      {/* Disabled Actions */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3">Disabled Actions</NText>

        <NActionItem
          className="rounded-lg border border-border mb-3 bg-muted opacity-50"
          titleClassName="text-muted-foreground"
          descriptionClassName="text-muted-foreground"
          name="Premium Feature"
          description="Upgrade to premium to access this feature"
          icon={<Ionicons name="star" size={20} color="#6b7280" />}
          disabled={true}
          onPress={() => {
            // This won't be called due to disabled state
            NToast.info('Feature requires premium subscription');
          }}
        />

        <NActionItem
          className="rounded-lg border border-border bg-muted opacity-50"
          titleClassName="text-muted-foreground"
          descriptionClassName="text-muted-foreground"
          name="Coming Soon"
          description="This feature will be available in the next update"
          icon={<Ionicons name="time" size={20} color="#6b7280" />}
          disabled={true}
          onPress={() => {
            // This won't be called due to disabled state
            NToast.info('Feature coming soon');
          }}
        />
      </NCard>

      {/* Action Management */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3">Action Management</NText>

        <NActionItem
          className="rounded-lg border border-orange-500 bg-orange-50 mb-4"
          titleClassName="text-orange-700 font-medium"
          descriptionClassName="text-orange-600"
          name="Reset All Settings"
          description="Reset all toggles and clear action history"
          icon={<Ionicons name="refresh" size={20} color="#ea580c" />}
          onPress={resetAll}
        />

        <View className="bg-muted rounded-lg p-3">
          <NText className="font-medium mb-2">Current Status:</NText>
          <NText className="text-sm text-muted-foreground mb-1">• Notifications: {notificationCount}</NText>
          <NText className="text-sm text-muted-foreground mb-1">• Network: {isOnline ? 'Online' : 'Offline'}</NText>
          <NText className="text-sm text-muted-foreground mb-1">• Theme: {isDarkMode ? 'Dark' : 'Light'}</NText>
          <NText className="text-sm text-muted-foreground mb-1">• Location: {isLocationEnabled ? 'Enabled' : 'Disabled'}</NText>
          <NText className="text-sm text-muted-foreground">• Total Actions: {actionHistory.length}</NText>
        </View>
      </NCard>

      {/* Action History */}
      {actionHistory.length > 0 && (
        <NCard className="p-4 mb-6">
          <NText className="text-lg font-semibold mb-3">Action History</NText>
          <View className="bg-muted rounded-lg p-3 max-h-40">
            <ScrollView showsVerticalScrollIndicator={false}>
              {actionHistory
                .slice(-10)
                .reverse()
                .map((item, index) => (
                  <View key={index} className="flex-row justify-between items-center py-1">
                    <NText className="text-sm flex-1">{item.action}</NText>
                    <NText className="text-xs text-muted-foreground ml-2">{item.timestamp}</NText>
                  </View>
                ))}
            </ScrollView>
          </View>
          {actionHistory.length > 10 && (
            <NText className="text-xs text-muted-foreground mt-2 text-center">Showing last 10 actions of {actionHistory.length} total</NText>
          )}
        </NCard>
      )}

      {/* Best Practices */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3">Best Practices</NText>

        <View className="space-y-2">
          <View className="flex-row items-start">
            <Ionicons name="checkmark-circle" size={16} color="#16a34a" style={{ marginTop: 2, marginRight: 8 }} />
            <NText className="text-sm flex-1">Use clear, descriptive names for action items</NText>
          </View>

          <View className="flex-row items-start">
            <Ionicons name="checkmark-circle" size={16} color="#16a34a" style={{ marginTop: 2, marginRight: 8 }} />
            <NText className="text-sm flex-1">Provide helpful descriptions that explain the action</NText>
          </View>

          <View className="flex-row items-start">
            <Ionicons name="checkmark-circle" size={16} color="#16a34a" style={{ marginTop: 2, marginRight: 8 }} />
            <NText className="text-sm flex-1">Use appropriate icons that match the action context</NText>
          </View>

          <View className="flex-row items-start">
            <Ionicons name="checkmark-circle" size={16} color="#16a34a" style={{ marginTop: 2, marginRight: 8 }} />
            <NText className="text-sm flex-1">Apply consistent styling for similar action types</NText>
          </View>

          <View className="flex-row items-start">
            <Ionicons name="checkmark-circle" size={16} color="#16a34a" style={{ marginTop: 2, marginRight: 8 }} />
            <NText className="text-sm flex-1">Use disabled state for unavailable actions</NText>
          </View>

          <View className="flex-row items-start">
            <Ionicons name="checkmark-circle" size={16} color="#16a34a" style={{ marginTop: 2, marginRight: 8 }} />
            <NText className="text-sm flex-1">Implement both tap and long press for advanced interactions</NText>
          </View>

          <View className="flex-row items-start">
            <Ionicons name="close-circle" size={16} color="#dc2626" style={{ marginTop: 2, marginRight: 8 }} />
            <NText className="text-sm flex-1">Don't use action items for navigation - use proper navigation components</NText>
          </View>

          <View className="flex-row items-start">
            <Ionicons name="close-circle" size={16} color="#dc2626" style={{ marginTop: 2, marginRight: 8 }} />
            <NText className="text-sm flex-1">Avoid overcrowding the interface with too many action items</NText>
          </View>
        </View>
      </NCard>
    </ScrollView>
  );
};

export default Component;
