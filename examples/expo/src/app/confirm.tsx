import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NButton, NCard, NConfirm, NText, NToast } from '@nayan-ui/react-native';

const Component = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [userCount, setUserCount] = useState(1247);
  const [fileCount, setFileCount] = useState(23);

  // Simulate async operations
  const handleAsyncDelete = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    setUserCount(prev => prev - 1);
    NToast.success('User deleted successfully!');
  };

  const handleBulkDelete = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setFileCount(0);
    NToast.success('All files deleted!');
  };

  const handleLogout = () => {
    NToast.info('Logged out successfully!');
  };

  const handleSaveChanges = () => {
    NToast.success('Changes saved successfully!');
  };

  const handleResetSettings = () => {
    NToast.success('Settings reset to defaults!');
  };

  const handleCancelSubscription = () => {
    NToast.success('Subscription cancelled!');
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Basic Confirm Examples */}
      <NText className="text-xl font-bold mb-3 text-text">Basic Confirm Dialogs</NText>

      <NCard className="p-4 mb-6">
        <View className="space-y-4">
          {/* Simple Confirmation */}
          <View>
            <NText className="text-text font-semibold mb-2">Simple Confirmation</NText>
            <NConfirm
              title="Are you sure?"
              description="This action cannot be undone."
              onResult={result => NToast.info(result ? 'Confirmed' : 'Cancelled')}>
              <NButton className="bg-blue-500 border-blue-500">
                <NText className="text-white">Simple Confirm</NText>
              </NButton>
            </NConfirm>
          </View>

          {/* Delete Confirmation */}
          <View>
            <NText className="text-text font-semibold mb-2">Delete Confirmation</NText>
            <NConfirm
              title="Delete Item?"
              description="This item will be permanently deleted and cannot be recovered."
              onResult={result => result && NToast.success('Item deleted!')}>
              <NButton className="bg-red-500 border-red-500">
                <NText className="text-white">Delete Item</NText>
              </NButton>
            </NConfirm>
          </View>

          {/* Save Confirmation */}
          <View>
            <NText className="text-text font-semibold mb-2">Save Confirmation</NText>
            <NConfirm
              title="Save Changes?"
              description="Your changes will be saved and applied immediately."
              onResult={result => result && handleSaveChanges()}>
              <NButton className="bg-green-500 border-green-500">
                <NText className="text-white">Save Changes</NText>
              </NButton>
            </NConfirm>
          </View>
        </View>
      </NCard>

      {/* Critical Actions */}
      <NText className="text-xl font-bold mb-3 text-text">Critical Actions</NText>

      <NCard className="p-4 mb-6">
        <NText className="text-text font-semibold mb-4">⚠️ High-Risk Operations</NText>

        <View className="space-y-4">
          {/* Account Deletion */}
          <View className="p-3 rounded-lg bg-red-50 border border-red-200">
            <NText className="text-red-800 font-medium mb-2">Delete Account</NText>
            <NText className="text-red-600 text-sm mb-3">This will permanently delete your account and all associated data.</NText>
            <NConfirm
              title="Delete Account?"
              description="⚠️ WARNING: This action is irreversible! All your data, settings, and content will be permanently lost. Are you absolutely sure you want to delete your account?"
              onResult={result => result && NToast.error('Account deletion initiated!')}>
              <NButton className="bg-red-600 border-red-600">
                <NText className="text-white text-sm">Delete Account</NText>
              </NButton>
            </NConfirm>
          </View>

          {/* System Reset */}
          <View className="p-3 rounded-lg bg-orange-50 border border-orange-200">
            <NText className="text-orange-800 font-medium mb-2">Reset All Settings</NText>
            <NText className="text-orange-600 text-sm mb-3">This will reset all your preferences to default values.</NText>
            <NConfirm
              title="Reset All Settings?"
              description="This will restore all settings to their default values. Your custom preferences, themes, and configurations will be lost."
              onResult={result => result && handleResetSettings()}>
              <NButton className="bg-orange-500 border-orange-500">
                <NText className="text-white text-sm">Reset Settings</NText>
              </NButton>
            </NConfirm>
          </View>

          {/* Bulk Operations */}
          <View className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <NText className="text-yellow-800 font-medium mb-2">Delete All Files ({fileCount})</NText>
            <NText className="text-yellow-600 text-sm mb-3">This will delete all {fileCount} files in your workspace.</NText>
            <NConfirm
              title="Delete All Files?"
              description={`You are about to delete ${fileCount} files. This action cannot be undone and all files will be permanently removed.`}
              onResult={result => result && handleBulkDelete()}>
              <NButton className="bg-yellow-600 border-yellow-600" disabled={fileCount === 0}>
                <NText className="text-white text-sm">{fileCount === 0 ? 'No Files to Delete' : `Delete ${fileCount} Files`}</NText>
              </NButton>
            </NConfirm>
          </View>
        </View>
      </NCard>

      {/* User Management */}
      <NText className="text-xl font-bold mb-3 text-text">User Management</NText>

      <NCard className="p-4 mb-6">
        <NText className="text-text font-semibold mb-4">👥 User Operations</NText>

        <View className="space-y-4">
          {/* Remove User */}
          <View className="flex-row items-center justify-between p-3 rounded-lg border border-gray-200">
            <View className="flex-1">
              <NText className="text-text font-medium">Remove User</NText>
              <NText className="text-muted text-sm">Total users: {userCount}</NText>
            </View>
            <NConfirm
              title="Remove User?"
              description="This user will be removed from the system and lose access to all resources. Their data will be preserved but they won't be able to access it."
              onResult={result => result && handleAsyncDelete()}>
              <NButton className="bg-red-500 border-red-500 px-4" disabled={isLoading}>
                <NText className="text-white text-sm">{isLoading ? 'Removing...' : 'Remove'}</NText>
              </NButton>
            </NConfirm>
          </View>

          {/* Logout */}
          <View className="flex-row items-center justify-between p-3 rounded-lg border border-gray-200">
            <View className="flex-1">
              <NText className="text-text font-medium">Logout</NText>
              <NText className="text-muted text-sm">End your current session</NText>
            </View>
            <NConfirm
              title="Logout?"
              description="You will be signed out and redirected to the login page. Any unsaved changes may be lost."
              onResult={result => result && handleLogout()}>
              <NButton className="bg-gray-500 border-gray-500 px-4">
                <NText className="text-white text-sm">Logout</NText>
              </NButton>
            </NConfirm>
          </View>
        </View>
      </NCard>

      {/* Subscription Management */}
      <NText className="text-xl font-bold mb-3 text-text">Subscription Management</NText>

      <NCard className="p-4 mb-6">
        <NText className="text-text font-semibold mb-4">💳 Billing Operations</NText>

        <View className="space-y-4">
          {/* Cancel Subscription */}
          <View className="p-4 rounded-lg bg-purple-50 border border-purple-200">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-1">
                <NText className="text-purple-800 font-medium">Premium Plan</NText>
                <NText className="text-purple-600 text-sm">$9.99/month • Next billing: Jan 15, 2024</NText>
              </View>
              <View className="bg-purple-100 px-2 py-1 rounded">
                <NText className="text-purple-700 text-xs font-medium">ACTIVE</NText>
              </View>
            </View>

            <NConfirm
              title="Cancel Subscription?"
              description="Your subscription will be cancelled and you'll lose access to premium features at the end of your current billing period (Jan 15, 2024). You can resubscribe anytime."
              onResult={result => result && handleCancelSubscription()}>
              <NButton className="bg-purple-600 border-purple-600 w-full">
                <NText className="text-white">Cancel Subscription</NText>
              </NButton>
            </NConfirm>
          </View>

          {/* Downgrade Plan */}
          <View className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-1">
                <NText className="text-blue-800 font-medium">Downgrade to Basic</NText>
                <NText className="text-blue-600 text-sm">Switch to free plan with limited features</NText>
              </View>
            </View>

            <NConfirm
              title="Downgrade Plan?"
              description="You'll be switched to the Basic plan immediately. Some premium features will be disabled, but your data will remain safe."
              onResult={result => result && NToast.success('Plan downgraded!')}>
              <NButton className="bg-blue-600 border-blue-600 w-full">
                <NText className="text-white">Downgrade Plan</NText>
              </NButton>
            </NConfirm>
          </View>
        </View>
      </NCard>

      {/* Custom Styled Confirms */}
      <NText className="text-xl font-bold mb-3 text-text">Custom Styled Confirms</NText>

      <NCard className="p-4 mb-6">
        <NText className="text-text font-semibold mb-4">🎨 Styled Confirmations</NText>

        <View className="space-y-4">
          {/* Success Style */}
          <View className="flex-row items-center gap-3">
            <NText className="text-text font-medium flex-1">Success Confirmation:</NText>
            <NConfirm
              title="✅ Publish Content?"
              description="Your content is ready to be published and will be visible to all users immediately."
              onResult={result => result && NToast.success('Content published!')}>
              <NButton className="bg-green-500 border-green-500">
                <NText className="text-white text-sm">Publish</NText>
              </NButton>
            </NConfirm>
          </View>

          {/* Warning Style */}
          <View className="flex-row items-center gap-3">
            <NText className="text-text font-medium flex-1">Warning Confirmation:</NText>
            <NConfirm
              title="⚠️ Overwrite File?"
              description="A file with this name already exists. Overwriting will replace the existing file permanently."
              onResult={result => result && NToast.warning('File overwritten!')}>
              <NButton className="bg-orange-500 border-orange-500">
                <NText className="text-white text-sm">Overwrite</NText>
              </NButton>
            </NConfirm>
          </View>

          {/* Info Style */}
          <View className="flex-row items-center gap-3">
            <NText className="text-text font-medium flex-1">Info Confirmation:</NText>
            <NConfirm
              title="ℹ️ Download Report?"
              description="The report will be downloaded to your device. This may take a few moments depending on your connection."
              onResult={result => result && NToast.info('Download started!')}>
              <NButton className="bg-blue-500 border-blue-500">
                <NText className="text-white text-sm">Download</NText>
              </NButton>
            </NConfirm>
          </View>

          {/* Error Style */}
          <View className="flex-row items-center gap-3">
            <NText className="text-text font-medium flex-1">Error Confirmation:</NText>
            <NConfirm
              title="🚨 Force Stop Process?"
              description="This will forcefully terminate the running process. Any unsaved work will be lost and the process may become corrupted."
              onResult={result => result && NToast.error('Process terminated!')}>
              <NButton className="bg-red-500 border-red-500">
                <NText className="text-white text-sm">Force Stop</NText>
              </NButton>
            </NConfirm>
          </View>
        </View>
      </NCard>

      {/* Loading States */}
      <NText className="text-xl font-bold mb-3 text-text">Async Operations</NText>

      <NCard className="p-4 mb-6">
        <NText className="text-text font-semibold mb-4">⏳ Operations with Loading States</NText>

        <View className="space-y-4">
          <View className="p-3 rounded-lg border border-gray-200">
            <NText className="text-text font-medium mb-2">Async Delete Operation</NText>
            <NText className="text-muted text-sm mb-3">This operation includes a loading state during processing.</NText>
            <NConfirm
              title="Delete with Processing?"
              description="This will delete the item after a brief processing period. You'll see a loading indicator during the operation."
              onResult={async result => {
                if (result) {
                  setIsLoading(true);
                  NToast.info('Processing deletion...');
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  setIsLoading(false);
                  NToast.success('Item deleted successfully!');
                }
              }}>
              <NButton className="bg-red-500 border-red-500" disabled={isLoading}>
                <NText className="text-white text-sm">{isLoading ? 'Processing...' : 'Delete with Loading'}</NText>
              </NButton>
            </NConfirm>
          </View>
        </View>
      </NCard>

      {/* Best Practices */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3">💡 Confirm Dialog Best Practices</NText>
        <View className="space-y-2">
          <NText className="text-sm text-muted">• Use clear, specific titles that describe the action</NText>
          <NText className="text-sm text-muted">• Provide detailed descriptions for irreversible actions</NText>
          <NText className="text-sm text-muted">• Use appropriate colors and icons to indicate severity</NText>
          <NText className="text-sm text-muted">• Include relevant context (counts, dates, names) in descriptions</NText>
          <NText className="text-sm text-muted">• Show loading states for async operations</NText>
          <NText className="text-sm text-muted">• Disable buttons during processing to prevent double-clicks</NText>
          <NText className="text-sm text-muted">• Use warning styles for destructive actions</NText>
          <NText className="text-sm text-muted">• Provide clear feedback after confirmation</NText>
        </View>
      </NCard>
    </ScrollView>
  );
};

export default Component;
