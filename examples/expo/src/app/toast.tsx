import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NButton, NCard, NInput, NSwitch, NText, NToast } from '@nayan-ui/react-native';

const Component = () => {
  // Toast interaction tracking
  const [toastActions, setToastActions] = useState<string[]>([]);
  const [toastSettings, setToastSettings] = useState({
    enableSounds: true,
    showDuration: true,
    autoHide: true,
    position: 'top'
  });

  // Demo states
  const [userName, setUserName] = useState('John Doe');
  const [cartItems, setCartItems] = useState(3);
  const [isOnline, setIsOnline] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(85);

  const addToastAction = (action: string) => {
    setToastActions(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${action}`]);
  };

  const showBasicToasts = () => {
    NToast.success('Success! Operation completed successfully');
    addToastAction('Success toast shown');

    setTimeout(() => {
      NToast.error('Error! Something went wrong');
      addToastAction('Error toast shown');
    }, 1000);

    setTimeout(() => {
      NToast.warning('Warning! Please check your settings');
      addToastAction('Warning toast shown');
    }, 2000);

    setTimeout(() => {
      NToast.info('Info: New update available');
      addToastAction('Info toast shown');
    }, 3000);
  };

  const showActionToasts = () => {
    NToast.success('File saved successfully!');
    addToastAction('Save action toast');

    setTimeout(() => {
      NToast.info('Download started in background');
      addToastAction('Download action toast');
    }, 1000);

    setTimeout(() => {
      NToast.warning('Upload failed - Retry?');
      addToastAction('Upload retry toast');
    }, 2000);
  };

  const showSystemToasts = () => {
    if (isOnline) {
      NToast.success('Connected to internet');
      addToastAction('Network connected toast');
    } else {
      NToast.error('No internet connection');
      addToastAction('Network disconnected toast');
    }

    setTimeout(() => {
      if (batteryLevel < 20) {
        NToast.warning(`Battery low: ${batteryLevel}%`);
        addToastAction('Low battery toast');
      } else {
        NToast.info(`Battery level: ${batteryLevel}%`);
        addToastAction('Battery status toast');
      }
    }, 1000);

    setTimeout(() => {
      NToast.info('Volume set to 75%');
      addToastAction('Volume change toast');
    }, 2000);
  };

  const showEcommerceToasts = () => {
    NToast.success('Item added to cart!');
    setCartItems(prev => prev + 1);
    addToastAction('Add to cart toast');

    setTimeout(() => {
      NToast.info('Payment processing...');
      addToastAction('Payment processing toast');
    }, 1000);

    setTimeout(() => {
      NToast.success('Payment successful! Order confirmed');
      addToastAction('Payment success toast');
    }, 3000);

    setTimeout(() => {
      NToast.info('Item added to wishlist ');
      addToastAction('Wishlist toast');
    }, 4000);
  };

  const showUserInteractionToasts = () => {
    NToast.success('Post liked! ');
    addToastAction('Like action toast');

    setTimeout(() => {
      NToast.info(`Now following ${userName}`);
      addToastAction('Follow action toast');
    }, 1000);

    setTimeout(() => {
      NToast.success('Rating submitted: ');
      addToastAction('Rating toast');
    }, 2000);

    setTimeout(() => {
      NToast.info('Comment posted successfully');
      addToastAction('Comment toast');
    }, 3000);
  };

  const showSpecialToasts = () => {
    NToast.success(`Welcome back, ${userName}! `);
    addToastAction('Welcome toast');

    setTimeout(() => {
      NToast.success('Achievement unlocked: First Login! ');
      addToastAction('Achievement toast');
    }, 1500);

    setTimeout(() => {
      NToast.info(' 50% off premium features!');
      addToastAction('Promotion toast');
    }, 3000);
  };

  const showThemeToasts = () => {
    NToast.info('Switched to dark mode ');
    addToastAction('Dark theme toast');

    setTimeout(() => {
      NToast.info('Switched to light mode ');
      addToastAction('Light theme toast');
    }, 2000);
  };

  const clearAllActions = () => {
    setToastActions([]);
    NToast.success('All actions cleared');
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Basic Toast Types */}
      <NText className="text-xl font-bold mb-3 text-text">Basic Toast Types</NText>
      <NCard className="mb-6">
        <View className="flex-row gap-2 flex-wrap mb-4">
          <NButton
            className="bg-green-500 border-green-500"
            onPress={() => {
              NToast.success('Success! Operation completed');
              addToastAction('Success toast');
            }}>
            Success
          </NButton>

          <NButton
            className="bg-red-500 border-red-500"
            onPress={() => {
              NToast.error('Error! Something went wrong');
              addToastAction('Error toast');
            }}>
            Error
          </NButton>

          <NButton
            className="bg-yellow-500 border-yellow-500"
            onPress={() => {
              NToast.warning('Warning! Check your settings');
              addToastAction('Warning toast');
            }}>
            Warning
          </NButton>

          <NButton
            className="bg-blue-500 border-blue-500"
            onPress={() => {
              NToast.info('Info: Update available');
              addToastAction('Info toast');
            }}>
            Info
          </NButton>
        </View>

        <NButton className="bg-purple-500 border-purple-500" onPress={showBasicToasts}>
          Show All Types (Sequential)
        </NButton>
      </NCard>

      {/* Action-Based Toasts */}
      <NText className="text-xl font-bold mb-3 text-text">Action-Based Toasts</NText>
      <NCard className="mb-6">
        <View className="flex-row gap-2 flex-wrap mb-4">
          <NButton
            className="bg-green-600 border-green-600"
            onPress={() => {
              NToast.success('Document saved successfully!');
              addToastAction('Save action');
            }}>
            Save
          </NButton>

          <NButton
            className="bg-red-600 border-red-600"
            onPress={() => {
              NToast.success('Item deleted successfully');
              addToastAction('Delete action');
            }}>
            Delete
          </NButton>

          <NButton
            className="bg-blue-600 border-blue-600"
            onPress={() => {
              NToast.info('Download started...');
              addToastAction('Download action');
              setTimeout(() => {
                NToast.success('Download completed!');
                addToastAction('Download completed');
              }, 3000);
            }}>
            Download
          </NButton>

          <NButton
            className="bg-orange-600 border-orange-600"
            onPress={() => {
              NToast.info('Uploading file...');
              addToastAction('Upload started');
              setTimeout(() => {
                NToast.success('Upload successful!');
                addToastAction('Upload completed');
              }, 2500);
            }}>
            Upload
          </NButton>
        </View>

        <NButton className="bg-indigo-500 border-indigo-500" onPress={showActionToasts}>
          Demo Action Sequence
        </NButton>
      </NCard>

      {/* System Notification Toasts */}
      <NText className="text-xl font-bold mb-3 text-text">System Notifications</NText>
      <NCard className="mb-6">
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <NText className="text-text">Network Status</NText>
            <NSwitch checked={isOnline} onChange={setIsOnline} />
          </View>
          <NText className="text-sm text-muted mb-3">Status: {isOnline ? ' Online' : ' Offline'}</NText>
        </View>

        <View className="flex-row gap-2 flex-wrap mb-4">
          <NButton
            className="bg-teal-500 border-teal-500"
            onPress={() => {
              NToast.info(`Network: ${isOnline ? 'Connected' : 'Disconnected'}`);
              addToastAction('Network status toast');
            }}>
            Network
          </NButton>

          <NButton
            className="bg-yellow-600 border-yellow-600"
            onPress={() => {
              NToast.warning(`Battery: ${batteryLevel}%`);
              addToastAction('Battery status toast');
            }}>
            Battery
          </NButton>

          <NButton
            className="bg-gray-600 border-gray-600"
            onPress={() => {
              NToast.info('Volume adjusted to 75%');
              addToastAction('Volume change toast');
            }}>
            Volume
          </NButton>
        </View>

        <NButton className="bg-cyan-500 border-cyan-500" onPress={showSystemToasts}>
          Show System Status
        </NButton>
      </NCard>

      {/* E-commerce Toasts */}
      <NText className="text-xl font-bold mb-3 text-text">E-commerce Toasts</NText>
      <NCard className="mb-6">
        <View className="mb-4">
          <NText className="text-text mb-2">Cart Items: {cartItems}</NText>
        </View>

        <View className="flex-row gap-2 flex-wrap mb-4">
          <NButton
            className="bg-green-700 border-green-700"
            onPress={() => {
              NToast.success('Added to cart! ');
              setCartItems(prev => prev + 1);
              addToastAction('Add to cart');
            }}>
            Add to Cart
          </NButton>

          <NButton
            className="bg-blue-700 border-blue-700"
            onPress={() => {
              NToast.info('Processing payment...');
              addToastAction('Payment processing');
              setTimeout(() => {
                NToast.success('Payment successful! ');
                addToastAction('Payment success');
              }, 2000);
            }}>
            Pay Now
          </NButton>

          <NButton
            className="bg-pink-500 border-pink-500"
            onPress={() => {
              NToast.success('Added to wishlist ');
              addToastAction('Add to wishlist');
            }}>
            Wishlist
          </NButton>
        </View>

        <NButton className="bg-emerald-500 border-emerald-500" onPress={showEcommerceToasts}>
          Demo Shopping Flow
        </NButton>
      </NCard>

      {/* User Interaction Toasts */}
      <NText className="text-xl font-bold mb-3 text-text">User Interactions</NText>
      <NCard className="mb-6">
        <View className="mb-4">
          <NInput label="User Name" value={userName} onChangeText={setUserName} className="mb-2" />
        </View>

        <View className="flex-row gap-2 flex-wrap mb-4">
          <NButton
            className="bg-red-400 border-red-400"
            onPress={() => {
              NToast.success('Post liked! ');
              addToastAction('Like action');
            }}>
            Like
          </NButton>

          <NButton
            className="bg-blue-400 border-blue-400"
            onPress={() => {
              NToast.info(`Following ${userName} `);
              addToastAction('Follow action');
            }}>
            Follow
          </NButton>

          <NButton
            className="bg-yellow-400 border-yellow-400"
            onPress={() => {
              NToast.success('Rating: ');
              addToastAction('Rating submitted');
            }}>
            Rate
          </NButton>
        </View>

        <NButton className="bg-violet-500 border-violet-500" onPress={showUserInteractionToasts}>
          Demo User Actions
        </NButton>
      </NCard>

      {/* Special Occasion Toasts */}
      <NText className="text-xl font-bold mb-3 text-text">Special Occasions</NText>
      <NCard className="mb-6">
        <View className="flex-row gap-2 flex-wrap mb-4">
          <NButton
            className="bg-green-400 border-green-400"
            onPress={() => {
              NToast.success(`Welcome back, ${userName}! `);
              addToastAction('Welcome message');
            }}>
            Welcome
          </NButton>

          <NButton
            className="bg-amber-500 border-amber-500"
            onPress={() => {
              NToast.success('Achievement unlocked! ');
              addToastAction('Achievement unlocked');
            }}>
            Achievement
          </NButton>

          <NButton
            className="bg-rose-500 border-rose-500"
            onPress={() => {
              NToast.info(' 50% off premium features!');
              addToastAction('Promotion shown');
            }}>
            Promotion
          </NButton>
        </View>

        <NButton className="bg-fuchsia-500 border-fuchsia-500" onPress={showSpecialToasts}>
          Show Special Messages
        </NButton>
      </NCard>

      {/* Theme Toggle Toasts */}
      <NText className="text-xl font-bold mb-3 text-text">Theme Toggle</NText>
      <NCard className="mb-6">
        <View className="flex-row gap-2 flex-wrap mb-4">
          <NButton
            className="bg-gray-800 border-gray-800"
            textClassName="text-white"
            onPress={() => {
              NToast.info('Dark mode enabled ');
              addToastAction('Dark mode enabled');
            }}>
            Dark Mode
          </NButton>

          <NButton
            className="bg-yellow-300 border-yellow-300"
            textClassName="text-gray-800"
            onPress={() => {
              NToast.info('Light mode enabled ');
              addToastAction('Light mode enabled');
            }}>
            Light Mode
          </NButton>
        </View>

        <NButton className="bg-gradient-to-r from-gray-800 to-yellow-300 border-gray-500" onPress={showThemeToasts}>
          Demo Theme Switch
        </NButton>
      </NCard>

      {/* Action Buttons */}
      <View className="flex-row gap-2 mt-4">
        <NButton className="flex-1 bg-red-500 border-red-500" onPress={clearAllActions}>
          Clear Actions
        </NButton>
        <NButton
          className="flex-1 bg-green-500 border-green-500"
          onPress={() => {
            const allData = {
              toastActions,
              toastSettings,
              userName,
              cartItems,
              isOnline,
              batteryLevel
            };
            console.log('All toast data:', allData);
            NToast.success('Toast data saved!');
          }}>
          Save Data
        </NButton>
      </View>

      {/* Toast Activity Log */}
      <NCard className="mt-6">
        <NText className="text-lg font-bold text-text mb-3">Toast Activity Log</NText>
        {toastActions.length === 0 ? (
          <NText className="text-muted text-sm">No toast actions yet. Try showing toasts above!</NText>
        ) : (
          <View className="space-y-1">
            {toastActions.map((action, index) => (
              <NText key={index} className="text-sm text-muted font-mono">
                {action}
              </NText>
            ))}
          </View>
        )}
      </NCard>

      {/* Toast Statistics */}
      <NCard className="mt-4">
        <NText className="text-lg font-bold text-text mb-3">Toast Statistics</NText>
        <View className="space-y-2">
          <NText className="text-sm text-muted">Total Toasts Shown: {toastActions.length}</NText>
          <NText className="text-sm text-muted">Current User: {userName}</NText>
          <NText className="text-sm text-muted">Cart Items: {cartItems}</NText>
          <NText className="text-sm text-muted">Network Status: {isOnline ? 'Online' : 'Offline'}</NText>
          <NText className="text-sm text-muted">Battery Level: {batteryLevel}%</NText>
        </View>
      </NCard>

      {/* Help Section */}
      <View className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <NText className="text-blue-800 font-semibold mb-2"> Toast Best Practices</NText>
        <NText className="text-blue-700 text-sm leading-relaxed">
          • Use appropriate toast types for different message contexts{'\n'}• Keep toast messages concise and actionable{'\n'}• Don't overuse toasts -
          they can become annoying{'\n'}• Use success toasts for completed actions{'\n'}• Use error toasts for failures with clear next steps{'\n'}•
          Use warning toasts for important notices{'\n'}• Use info toasts for general notifications{'\n'}• Consider toast timing and auto-dismiss
          behavior{'\n'}• Test toast visibility across different screen sizes{'\n'}• Ensure toasts are accessible to screen readers
        </NText>
      </View>
    </ScrollView>
  );
};

export default Component;
