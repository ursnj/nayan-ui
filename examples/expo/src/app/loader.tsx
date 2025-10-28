import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NButton, NCard, NLoading, NText, NToast } from '@nayan-ui/react-native';

const Component = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Simulate form submission
  const handleFormSubmit = async () => {
    setIsFormLoading(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsFormLoading(false);
    NToast.success('Form submitted successfully!');
  };

  // Simulate data fetching
  const handleDataFetch = async () => {
    setIsDataLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    setIsDataLoading(false);
    NToast.info('Data loaded successfully!');
  };

  // Simulate button action
  const handleButtonAction = async () => {
    setIsButtonLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsButtonLoading(false);
    NToast.success('Action completed!');
  };

  // Simulate progress loading
  const handleProgressLoad = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          NToast.success('Progress completed!');
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Basic Loaders */}
      <NText className="text-xl font-bold mb-3 text-text">Basic Loaders</NText>

      <NCard className="p-4 mb-6">
        <View className="items-center mb-4">
          <NText className="mb-3">Default loader</NText>
          <NLoading />
        </View>

        <View className="items-center mb-4">
          <NText className="mb-3">Small loader</NText>
          <NLoading size="small" />
        </View>

        <View className="items-center">
          <NText className="mb-3">Large loader</NText>
          <NLoading size="large" />
        </View>
      </NCard>

      {/* Colored Loaders */}
      <NText className="text-xl font-bold mb-3 text-text">Colored Loaders</NText>

      <NCard className="p-4 mb-6">
        <View className="flex-row justify-around items-center mb-4">
          <View className="items-center">
            <NText className="mb-2 text-sm">Primary</NText>
            <NLoading color="#3b82f6" />
          </View>
          <View className="items-center">
            <NText className="mb-2 text-sm">Success</NText>
            <NLoading color="#10b981" />
          </View>
          <View className="items-center">
            <NText className="mb-2 text-sm">Warning</NText>
            <NLoading color="#f59e0b" />
          </View>
          <View className="items-center">
            <NText className="mb-2 text-sm">Error</NText>
            <NLoading color="#ef4444" />
          </View>
        </View>
      </NCard>

      {/* Inline Loaders */}
      <NText className="text-xl font-bold mb-3 text-text">Inline Loaders</NText>

      <NCard className="p-4 mb-6">
        <View className="flex-row items-center mb-3">
          <NLoading size="small" />
          <NText className="ml-2">Loading user data...</NText>
        </View>

        <View className="flex-row items-center mb-3">
          <NLoading size="small" color="#10b981" />
          <NText className="ml-2">Syncing files...</NText>
        </View>

        <View className="flex-row items-center">
          <NLoading size="small" color="#f59e0b" />
          <NText className="ml-2">Processing payment...</NText>
        </View>
      </NCard>

      {/* Loading States */}
      <NText className="text-xl font-bold mb-3 text-text">Interactive Loading States</NText>

      <NCard className="p-4 mb-6">
        <View className="mb-4">
          <NText className="font-semibold mb-2">Form Submission</NText>
          <View className="flex-row items-center justify-between">
            <NButton onPress={handleFormSubmit} disabled={isFormLoading} className={isFormLoading ? 'opacity-50' : ''}>
              {isFormLoading ? 'Submitting...' : 'Submit Form'}
            </NButton>
            {isFormLoading && <NLoading size="small" />}
          </View>
        </View>

        <View className="mb-4">
          <NText className="font-semibold mb-2">Data Fetching</NText>
          <View className="flex-row items-center justify-between">
            <NButton onPress={handleDataFetch} disabled={isDataLoading} className={isDataLoading ? 'opacity-50' : ''}>
              {isDataLoading ? 'Loading Data...' : 'Fetch Data'}
            </NButton>
            {isDataLoading && <NLoading size="small" color="#10b981" />}
          </View>
        </View>

        <View>
          <NText className="font-semibold mb-2">Button Action</NText>
          <View className="flex-row items-center justify-between">
            <NButton onPress={handleButtonAction} disabled={isButtonLoading} className={isButtonLoading ? 'opacity-50' : ''}>
              {isButtonLoading ? 'Processing...' : 'Execute Action'}
            </NButton>
            {isButtonLoading && <NLoading size="small" color="#f59e0b" />}
          </View>
        </View>
      </NCard>

      {/* Overlay Loaders */}
      <NText className="text-xl font-bold mb-3 text-text">Overlay Loaders</NText>

      <NCard className="p-4 mb-6">
        <View className="mb-4">
          <NText className="font-semibold mb-2">Content with Overlay</NText>
          <View className="relative bg-gray-100 dark:bg-gray-800 p-4 rounded-lg min-h-24">
            <NText className="mb-2">This is some content that can be overlaid with a loader.</NText>
            <NText className="text-sm text-muted-foreground">Click the button below to see the overlay effect.</NText>

            {isLoading && (
              <View className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                <View className="items-center">
                  <NLoading />
                  <NText className="mt-2 text-sm">Loading...</NText>
                </View>
              </View>
            )}
          </View>

          <NButton
            className="mt-3"
            onPress={() => {
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 3000);
            }}
            disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Show Overlay Loader'}
          </NButton>
        </View>
      </NCard>

      {/* Progress Simulation */}
      <NText className="text-xl font-bold mb-3 text-text">Progress Loading</NText>

      <NCard className="p-4 mb-6">
        <View className="items-center">
          <NText className="mb-3">Simulated Progress: {progress}%</NText>
          <View className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
            <View className="bg-blue-500 h-2 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
          </View>

          {progress > 0 && progress < 100 && (
            <View className="flex-row items-center mb-3">
              <NLoading size="small" />
              <NText className="ml-2">Processing... {progress}%</NText>
            </View>
          )}

          <NButton onPress={handleProgressLoad} disabled={progress > 0 && progress < 100}>
            {progress > 0 && progress < 100 ? 'Loading...' : 'Start Progress'}
          </NButton>
        </View>
      </NCard>

      {/* Card Loading States */}
      <NText className="text-xl font-bold mb-3 text-text">Card Loading States</NText>

      <NCard className="p-4 mb-6">
        <View className="mb-4">
          <NText className="font-semibold mb-2">User Profile Card</NText>
          <View className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full mr-3 items-center justify-center">
                <NLoading size="small" />
              </View>
              <View className="flex-1">
                <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <View className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </View>
            </View>
          </View>
        </View>

        <View className="mb-4">
          <NText className="font-semibold mb-2">Content Card</NText>
          <View className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <View className="flex-row items-center justify-center py-8">
              <NLoading />
              <NText className="ml-3">Loading content...</NText>
            </View>
          </View>
        </View>

        <View>
          <NText className="font-semibold mb-2">List Item Loading</NText>
          <View className="space-y-2">
            {[1, 2, 3].map(item => (
              <View key={item} className="flex-row items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <NLoading size="small" />
                <View className="ml-3 flex-1">
                  <View className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                  <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                </View>
              </View>
            ))}
          </View>
        </View>
      </NCard>

      {/* Different Loading Messages */}
      <NText className="text-xl font-bold mb-3 text-text">Loading Messages</NText>

      <NCard className="p-4 mb-6">
        <View className="space-y-4">
          <View className="items-center">
            <NLoading />
            <NText className="mt-2 text-center">Please wait...</NText>
          </View>

          <View className="items-center">
            <NLoading color="#10b981" />
            <NText className="mt-2 text-center">Saving your changes...</NText>
          </View>

          <View className="items-center">
            <NLoading color="#f59e0b" />
            <NText className="mt-2 text-center">Uploading files...</NText>
          </View>

          <View className="items-center">
            <NLoading color="#ef4444" />
            <NText className="mt-2 text-center">Deleting items...</NText>
          </View>
        </View>
      </NCard>

      {/* Best Practices */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3">💡 Loader Best Practices</NText>
        <View className="space-y-2">
          <NText className="text-sm">• Use appropriate sizes: small for inline, default for cards, large for full-screen</NText>
          <NText className="text-sm">• Choose colors that match the action context (success, warning, error)</NText>
          <NText className="text-sm">• Provide clear loading messages to inform users what's happening</NText>
          <NText className="text-sm">• Use overlay loaders for content that shouldn't be interacted with while loading</NText>
          <NText className="text-sm">• Disable buttons and form elements during loading states</NText>
          <NText className="text-sm">• Consider skeleton screens for better perceived performance</NText>
          <NText className="text-sm">• Always provide feedback when loading completes (success/error messages)</NText>
          <NText className="text-sm">• Use progress indicators for long-running operations when possible</NText>
        </View>
      </NCard>
    </ScrollView>
  );
};

export default Component;
