import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NAlert, NButton, NText, NToast } from '@nayan-ui/react-native';

const Component = () => {
  const [showDismissible, setShowDismissible] = useState(true);
  const [showSuccess, setShowSuccess] = useState(true);
  const [showWarning, setShowWarning] = useState(true);
  const [showError, setShowError] = useState(true);

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Basic Alert */}
      <NText className="text-xl font-bold mb-3 text-text">Basic Alert</NText>
      <NAlert
        title="Information"
        description="This is a basic alert with a title and description. It provides important information to the user."
        className="mb-6"
      />

      {/* Alert without Title */}
      <NText className="text-xl font-bold mb-3 text-text">Alert without Title</NText>
      <NAlert description="This alert doesn't have a title, just a description. Sometimes a simple message is all you need." className="mb-6" />

      {/* Success Alert */}
      <NText className="text-xl font-bold mb-3 text-text">Success Alert</NText>
      {showSuccess && (
        <View className="mb-4">
          <NAlert
            title="Success!"
            description="Your changes have been saved successfully. All data has been updated in the system."
            className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
            titleClassName="text-green-800 dark:text-green-200"
            descriptionClassName="text-green-700 dark:text-green-300"
            iconClassName="border-green-600 dark:border-green-400"
          />
          <NButton className="mt-2 bg-green-500 border-green-500" onPress={() => setShowSuccess(false)}>
            Dismiss Success Alert
          </NButton>
        </View>
      )}
      {!showSuccess && (
        <NButton className="mb-4 bg-green-500 border-green-500" onPress={() => setShowSuccess(true)}>
          Show Success Alert
        </NButton>
      )}

      {/* Warning Alert */}
      <NText className="text-xl font-bold mb-3 text-text">Warning Alert</NText>
      {showWarning && (
        <View className="mb-4">
          <NAlert
            title="Warning"
            description="Please review your settings before proceeding. Some configurations may affect system performance."
            className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800"
            titleClassName="text-yellow-800 dark:text-yellow-200"
            descriptionClassName="text-yellow-700 dark:text-yellow-300"
            iconClassName="border-yellow-600 dark:border-yellow-400"
          />
          <NButton className="mt-2 bg-yellow-500 border-yellow-500" textClassName="text-black" onPress={() => setShowWarning(false)}>
            Dismiss Warning
          </NButton>
        </View>
      )}
      {!showWarning && (
        <NButton className="mb-4 bg-yellow-500 border-yellow-500" textClassName="text-black" onPress={() => setShowWarning(true)}>
          Show Warning Alert
        </NButton>
      )}

      {/* Error Alert */}
      <NText className="text-xl font-bold mb-3 text-text">Error Alert</NText>
      {showError && (
        <View className="mb-4">
          <NAlert
            title="Error"
            description="An error occurred while processing your request. Please try again or contact support if the problem persists."
            className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
            titleClassName="text-red-800 dark:text-red-200"
            descriptionClassName="text-red-700 dark:text-red-300"
            iconClassName="border-red-600 dark:border-red-400"
          />
          <NButton className="mt-2 bg-red-500 border-red-500" onPress={() => setShowError(false)}>
            Dismiss Error
          </NButton>
        </View>
      )}
      {!showError && (
        <NButton className="mb-4 bg-red-500 border-red-500" onPress={() => setShowError(true)}>
          Show Error Alert
        </NButton>
      )}

      {/* Info Alert */}
      <NText className="text-xl font-bold mb-3 text-text">Info Alert</NText>
      <NAlert
        title="Did you know?"
        description="You can customize the appearance of alerts by using different className props for the container, title, description, and even the icon."
        className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 mb-6"
        titleClassName="text-blue-800 dark:text-blue-200"
        descriptionClassName="text-blue-700 dark:text-blue-300"
        iconClassName="border-blue-600 dark:border-blue-400"
      />

      {/* Custom Styled Alerts */}
      <NText className="text-xl font-bold mb-3 text-text">Custom Styled Alerts</NText>

      {/* Gradient Alert */}
      <NAlert
        title="Premium Feature"
        description="This alert uses a gradient background to highlight premium or special features."
        className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 border-purple-300 dark:border-purple-700 mb-4"
        titleClassName="text-purple-800 dark:text-purple-200 font-bold"
        descriptionClassName="text-purple-700 dark:text-purple-300"
        iconClassName="border-purple-600 dark:border-purple-400"
      />

      {/* Contrast Alert */}
      <NAlert
        title="High Contrast"
        description="This alert demonstrates high contrast styling that adapts to both light and dark themes."
        className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 mb-4"
        titleClassName="text-gray-900 dark:text-gray-100 font-semibold"
        descriptionClassName="text-gray-700 dark:text-gray-300"
        iconClassName="border-gray-600 dark:border-gray-400"
      />

      {/* Rounded Alert */}
      <NAlert
        title="Rounded Design"
        description="This alert has more rounded corners for a softer, modern appearance."
        className="bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800 rounded-2xl mb-6"
        titleClassName="text-indigo-800 dark:text-indigo-200"
        descriptionClassName="text-indigo-700 dark:text-indigo-300"
        iconClassName="border-indigo-600 dark:border-indigo-400"
      />

      {/* System Alerts */}
      <NText className="text-xl font-bold mb-3 text-text">System Alerts</NText>

      <NAlert
        title="Maintenance Notice"
        description="Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM EST. Some features may be temporarily unavailable."
        className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 mb-4"
        titleClassName="text-orange-800 dark:text-orange-200"
        descriptionClassName="text-orange-700 dark:text-orange-300"
        iconClassName="border-orange-600 dark:border-orange-400"
      />

      <NAlert
        title="New Version Available"
        description="Version 2.1.0 is now available with new features and bug fixes. Update now to get the latest improvements."
        className="bg-cyan-50 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-800 mb-4"
        titleClassName="text-cyan-800 dark:text-cyan-200"
        descriptionClassName="text-cyan-700 dark:text-cyan-300"
        iconClassName="border-cyan-600 dark:border-cyan-400"
      />

      <NAlert
        title="Storage Almost Full"
        description="You're using 95% of your storage space. Consider deleting old files or upgrading your plan to avoid service interruption."
        className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 mb-6"
        titleClassName="text-red-800 dark:text-red-200"
        descriptionClassName="text-red-700 dark:text-red-300"
        iconClassName="border-red-600 dark:border-red-400"
      />

      {/* Interactive Dismissible Alert */}
      <NText className="text-xl font-bold mb-3 text-text">Interactive Alert</NText>
      {showDismissible ? (
        <View className="mb-4">
          <NAlert
            title="Welcome!"
            description="Welcome to our application! This alert can be dismissed by clicking the button below."
            className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
            titleClassName="text-green-800 dark:text-green-200"
            descriptionClassName="text-green-700 dark:text-green-300"
            iconClassName="border-green-600 dark:border-green-400"
          />
          <View className="flex-row gap-2 mt-3">
            <NButton
              className="flex-1 bg-green-500 border-green-500"
              onPress={() => {
                setShowDismissible(false);
                NToast.success('Welcome alert dismissed!');
              }}>
              Got it, thanks!
            </NButton>
            <NButton
              className="flex-1 bg-transparent border-green-500"
              textClassName="text-green-600"
              onPress={() => NToast.info('Learn more clicked!')}>
              Learn More
            </NButton>
          </View>
        </View>
      ) : (
        <NButton className="mb-4 bg-green-500 border-green-500" onPress={() => setShowDismissible(true)}>
          Show Welcome Alert
        </NButton>
      )}

      {/* Long Content Alert */}
      <NText className="text-xl font-bold mb-3 text-text">Long Content Alert</NText>
      <NAlert
        title="Terms and Conditions Update"
        description="We have updated our Terms and Conditions to provide better clarity on data usage, privacy policies, and user rights. The changes include new sections on data retention, third-party integrations, and user consent mechanisms. Please review the updated terms to understand how these changes may affect your use of our services. By continuing to use our application, you acknowledge that you have read and agree to the updated terms."
        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 mb-6"
        titleClassName="text-gray-800 dark:text-gray-200"
        descriptionClassName="text-gray-700 dark:text-gray-300 leading-relaxed"
        iconClassName="border-gray-600 dark:border-gray-400"
      />

      {/* Help Section */}
      <View className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <NText className="text-blue-800 dark:text-blue-200 font-semibold mb-2">💡 Alert Best Practices</NText>
        <NText className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
          • Use success alerts for positive confirmations and completed actions{'\n'}• Use warning alerts for important information that needs
          attention{'\n'}• Use error alerts for problems that need immediate action{'\n'}• Use info alerts for helpful tips and general information
          {'\n'}• Keep alert messages concise but informative{'\n'}• Provide clear actions when possible (dismiss, learn more, etc.){'\n'}• Use
          consistent styling with dark mode support across your application
        </NText>
      </View>
    </ScrollView>
  );
};

export default Component;
