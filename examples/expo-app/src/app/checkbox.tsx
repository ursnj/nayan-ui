import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NButton, NCard, NCheck, NText, NToast } from '@nayan-ui/react-native';

const Component = () => {
  // Basic checkbox states
  const [basicChecked, setBasicChecked] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(true);
  const [enableNotifications, setEnableNotifications] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptCookies, setAcceptCookies] = useState(false);

  // Feature toggles
  const [features, setFeatures] = useState({
    darkMode: false,
    autoSave: true,
    syncData: false,
    offlineMode: false,
    analytics: true,
    betaFeatures: false,
    advancedMode: false,
    debugMode: false
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
    marketing: false,
    security: true,
    updates: true,
    social: false,
    digest: false
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    shareData: false,
    trackActivity: false,
    personalizedAds: false,
    locationAccess: false,
    contactsAccess: false,
    cameraAccess: false,
    microphoneAccess: false,
    storageAccess: true
  });

  // Task checklist
  const [tasks, setTasks] = useState({
    setupProfile: true,
    verifyEmail: true,
    addPayment: false,
    inviteTeam: false,
    completeOnboarding: false,
    configureSecurity: false,
    customizeSettings: false,
    exploreFeatures: false
  });

  // Shopping list
  const [shoppingList, setShoppingList] = useState({
    milk: false,
    bread: true,
    eggs: false,
    cheese: false,
    apples: true,
    bananas: false,
    chicken: false,
    rice: false,
    pasta: false,
    yogurt: false
  });

  const updateFeature = (key: string, value: boolean) => {
    setFeatures(prev => ({ ...prev, [key]: value }));
    NToast.info(`Feature ${key}: ${value ? 'enabled' : 'disabled'}`);
  };

  const updateNotification = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    NToast.info(`${key} notifications: ${value ? 'enabled' : 'disabled'}`);
  };

  const updatePrivacy = (key: string, value: boolean) => {
    setPrivacy(prev => ({ ...prev, [key]: value }));
    NToast.warning(`Privacy setting ${key}: ${value ? 'allowed' : 'denied'}`);
  };

  const updateTask = (key: string, value: boolean) => {
    setTasks(prev => ({ ...prev, [key]: value }));
    NToast.success(`Task ${key}: ${value ? 'completed' : 'pending'}`);
  };

  const updateShoppingItem = (key: string, value: boolean) => {
    setShoppingList(prev => ({ ...prev, [key]: value }));
    NToast.info(`${key}: ${value ? 'added to cart' : 'removed from cart'}`);
  };

  const resetAllCheckboxes = () => {
    setBasicChecked(false);
    setAgreeTerms(false);
    setSubscribeNewsletter(false);
    setEnableNotifications(false);
    setRememberMe(false);
    setAcceptCookies(false);
    setFeatures({
      darkMode: false,
      autoSave: false,
      syncData: false,
      offlineMode: false,
      analytics: false,
      betaFeatures: false,
      advancedMode: false,
      debugMode: false
    });
    setNotifications({
      email: false,
      push: false,
      sms: false,
      marketing: false,
      security: false,
      updates: false,
      social: false,
      digest: false
    });
    setPrivacy({
      shareData: false,
      trackActivity: false,
      personalizedAds: false,
      locationAccess: false,
      contactsAccess: false,
      cameraAccess: false,
      microphoneAccess: false,
      storageAccess: false
    });
    setTasks({
      setupProfile: false,
      verifyEmail: false,
      addPayment: false,
      inviteTeam: false,
      completeOnboarding: false,
      configureSecurity: false,
      customizeSettings: false,
      exploreFeatures: false
    });
    setShoppingList({
      milk: false,
      bread: false,
      eggs: false,
      cheese: false,
      apples: false,
      bananas: false,
      chicken: false,
      rice: false,
      pasta: false,
      yogurt: false
    });
    NToast.success('All checkboxes reset');
  };

  const selectAllFeatures = () => {
    const allSelected = Object.keys(features).reduce((acc, key) => ({ ...acc, [key]: true }), {} as typeof features);
    setFeatures(allSelected);
    NToast.success('All features enabled');
  };

  const selectAllTasks = () => {
    const allSelected = Object.keys(tasks).reduce((acc, key) => ({ ...acc, [key]: true }), {} as typeof tasks);
    setTasks(allSelected);
    NToast.success('All tasks marked as completed');
  };

  const calculateProgress = (items: Record<string, boolean>) => {
    const completed = Object.values(items).filter(Boolean).length;
    const total = Object.values(items).length;
    return Math.round((completed / total) * 100);
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Basic Checkbox */}
      <NText className="text-xl font-bold mb-3 text-text">Basic Checkbox</NText>
      <NCard className="mb-6">
        <NCheck
          label="Basic Checkbox"
          checked={basicChecked}
          onChange={checked => {
            setBasicChecked(checked);
            NToast.info(`Basic checkbox: ${checked ? 'checked' : 'unchecked'}`);
          }}
        />
      </NCard>

      {/* Terms and Agreements */}
      <NText className="text-xl font-bold mb-3 text-text">Terms & Agreements</NText>
      <NCard className="mb-6">
        <NCheck
          label="I agree to the Terms and Conditions"
          checked={agreeTerms}
          onChange={checked => {
            setAgreeTerms(checked);
            NToast.success(checked ? 'Terms accepted' : 'Terms declined');
          }}
        />
        <NCheck label="Subscribe to newsletter for updates" checked={subscribeNewsletter} onChange={setSubscribeNewsletter} />
        <NCheck label="Enable push notifications" checked={enableNotifications} onChange={setEnableNotifications} />
        <NCheck label="Remember me on this device" checked={rememberMe} onChange={setRememberMe} />
        <NCheck
          label="Accept cookies for better experience"
          checked={acceptCookies}
          onChange={checked => {
            setAcceptCookies(checked);
            NToast.info(checked ? 'Cookies accepted' : 'Cookies declined');
          }}
        />
      </NCard>

      {/* Feature Toggles */}
      <NText className="text-xl font-bold mb-3 text-text">Feature Settings</NText>
      <NCard className="mb-6">
        <View className="flex-row justify-between items-center mb-3">
          <NText className="text-lg font-semibold text-text">App Features</NText>
          <NButton className="px-3 py-1 bg-blue-500 border-blue-500" onPress={selectAllFeatures}>
            Enable All
          </NButton>
        </View>
        <NCheck label="Dark Mode Theme" checked={features.darkMode} onChange={checked => updateFeature('darkMode', checked)} />
        <NCheck label="Auto-Save Documents" checked={features.autoSave} onChange={checked => updateFeature('autoSave', checked)} />
        <NCheck label="Sync Data Across Devices" checked={features.syncData} onChange={checked => updateFeature('syncData', checked)} />
        <NCheck label="Offline Mode" checked={features.offlineMode} onChange={checked => updateFeature('offlineMode', checked)} />
        <NCheck label="Analytics & Performance Tracking" checked={features.analytics} onChange={checked => updateFeature('analytics', checked)} />
        <NCheck label="Beta Features Access" checked={features.betaFeatures} onChange={checked => updateFeature('betaFeatures', checked)} />
        <NCheck label="Advanced Mode" checked={features.advancedMode} onChange={checked => updateFeature('advancedMode', checked)} />
        <NCheck label="Debug Mode (Developers)" checked={features.debugMode} onChange={checked => updateFeature('debugMode', checked)} />
      </NCard>

      {/* Notification Preferences */}
      <NText className="text-xl font-bold mb-3 text-text">Notification Preferences</NText>
      <NCard className="mb-6">
        <NCheck label="Email Notifications" checked={notifications.email} onChange={checked => updateNotification('email', checked)} />
        <NCheck label="Push Notifications" checked={notifications.push} onChange={checked => updateNotification('push', checked)} />
        <NCheck label="SMS Notifications" checked={notifications.sms} onChange={checked => updateNotification('sms', checked)} />
        <NCheck label="Marketing Communications" checked={notifications.marketing} onChange={checked => updateNotification('marketing', checked)} />
        <NCheck label="Security Alerts" checked={notifications.security} onChange={checked => updateNotification('security', checked)} />
        <NCheck label="Product Updates" checked={notifications.updates} onChange={checked => updateNotification('updates', checked)} />
        <NCheck label="Social Activity" checked={notifications.social} onChange={checked => updateNotification('social', checked)} />
        <NCheck label="Weekly Digest" checked={notifications.digest} onChange={checked => updateNotification('digest', checked)} />
      </NCard>

      {/* Privacy Settings */}
      <NText className="text-xl font-bold mb-3 text-text">Privacy & Permissions</NText>
      <NCard className="mb-6">
        <NCheck label="Share Usage Data" checked={privacy.shareData} onChange={checked => updatePrivacy('shareData', checked)} />
        <NCheck label="Track Activity" checked={privacy.trackActivity} onChange={checked => updatePrivacy('trackActivity', checked)} />
        <NCheck
          label="Personalized Advertisements"
          checked={privacy.personalizedAds}
          onChange={checked => updatePrivacy('personalizedAds', checked)}
        />
        <NCheck label="Location Access" checked={privacy.locationAccess} onChange={checked => updatePrivacy('locationAccess', checked)} />
        <NCheck label="Contacts Access" checked={privacy.contactsAccess} onChange={checked => updatePrivacy('contactsAccess', checked)} />
        <NCheck label="Camera Access" checked={privacy.cameraAccess} onChange={checked => updatePrivacy('cameraAccess', checked)} />
        <NCheck label="Microphone Access" checked={privacy.microphoneAccess} onChange={checked => updatePrivacy('microphoneAccess', checked)} />
        <NCheck label="Storage Access" checked={privacy.storageAccess} onChange={checked => updatePrivacy('storageAccess', checked)} />
      </NCard>

      {/* Task Checklist */}
      <NText className="text-xl font-bold mb-3 text-text">Onboarding Tasks</NText>
      <NCard className="mb-6">
        <View className="flex-row justify-between items-center mb-3">
          <NText className="text-lg font-semibold text-text">Progress: {calculateProgress(tasks)}% Complete</NText>
          <NButton className="px-3 py-1 bg-green-500 border-green-500" onPress={selectAllTasks}>
            Complete All
          </NButton>
        </View>
        <NCheck
          label="✓ Set up your profile"
          checked={tasks.setupProfile}
          onChange={checked => updateTask('setupProfile', checked)}
          labelClassName={tasks.setupProfile ? 'line-through text-muted' : ''}
        />
        <NCheck
          label="✓ Verify your email address"
          checked={tasks.verifyEmail}
          onChange={checked => updateTask('verifyEmail', checked)}
          labelClassName={tasks.verifyEmail ? 'line-through text-muted' : ''}
        />
        <NCheck
          label="Add payment method"
          checked={tasks.addPayment}
          onChange={checked => updateTask('addPayment', checked)}
          labelClassName={tasks.addPayment ? 'line-through text-muted' : ''}
        />
        <NCheck
          label="Invite team members"
          checked={tasks.inviteTeam}
          onChange={checked => updateTask('inviteTeam', checked)}
          labelClassName={tasks.inviteTeam ? 'line-through text-muted' : ''}
        />
        <NCheck
          label="Complete onboarding tutorial"
          checked={tasks.completeOnboarding}
          onChange={checked => updateTask('completeOnboarding', checked)}
          labelClassName={tasks.completeOnboarding ? 'line-through text-muted' : ''}
        />
        <NCheck
          label="Configure security settings"
          checked={tasks.configureSecurity}
          onChange={checked => updateTask('configureSecurity', checked)}
          labelClassName={tasks.configureSecurity ? 'line-through text-muted' : ''}
        />
        <NCheck
          label="Customize app settings"
          checked={tasks.customizeSettings}
          onChange={checked => updateTask('customizeSettings', checked)}
          labelClassName={tasks.customizeSettings ? 'line-through text-muted' : ''}
        />
        <NCheck
          label="Explore key features"
          checked={tasks.exploreFeatures}
          onChange={checked => updateTask('exploreFeatures', checked)}
          labelClassName={tasks.exploreFeatures ? 'line-through text-muted' : ''}
        />
      </NCard>

      {/* Shopping List */}
      <NText className="text-xl font-bold mb-3 text-text">Shopping List</NText>
      <NCard className="mb-6">
        <View className="flex-row justify-between items-center mb-3">
          <NText className="text-lg font-semibold text-text">Items: {Object.values(shoppingList).filter(Boolean).length}/10 selected</NText>
        </View>
        <NCheck label="🥛 Milk" checked={shoppingList.milk} onChange={checked => updateShoppingItem('milk', checked)} />
        <NCheck label="🍞 Bread" checked={shoppingList.bread} onChange={checked => updateShoppingItem('bread', checked)} />
        <NCheck label="🥚 Eggs" checked={shoppingList.eggs} onChange={checked => updateShoppingItem('eggs', checked)} />
        <NCheck label="🧀 Cheese" checked={shoppingList.cheese} onChange={checked => updateShoppingItem('cheese', checked)} />
        <NCheck label="🍎 Apples" checked={shoppingList.apples} onChange={checked => updateShoppingItem('apples', checked)} />
        <NCheck label="🍌 Bananas" checked={shoppingList.bananas} onChange={checked => updateShoppingItem('bananas', checked)} />
        <NCheck label="🍗 Chicken" checked={shoppingList.chicken} onChange={checked => updateShoppingItem('chicken', checked)} />
        <NCheck label="🍚 Rice" checked={shoppingList.rice} onChange={checked => updateShoppingItem('rice', checked)} />
        <NCheck label="🍝 Pasta" checked={shoppingList.pasta} onChange={checked => updateShoppingItem('pasta', checked)} />
        <NCheck label="🥛 Yogurt" checked={shoppingList.yogurt} onChange={checked => updateShoppingItem('yogurt', checked)} />
      </NCard>

      {/* Disabled Checkbox */}
      <NText className="text-xl font-bold mb-3 text-text">Disabled Checkbox</NText>
      <NCard className="mb-6">
        <NCheck label="Premium Feature (Upgrade Required)" checked={false} onChange={() => {}} disabled={true} />
        <NCheck label="Enterprise Feature (Contact Sales)" checked={false} onChange={() => {}} disabled={true} />
        <NText className="text-sm text-muted mt-2">These features require a premium subscription or enterprise plan.</NText>
      </NCard>

      {/* Custom Styled Checkbox */}
      <NText className="text-xl font-bold mb-3 text-text">Custom Styled</NText>
      <NCard className="mb-6">
        <NCheck label="Custom Purple Checkbox" checked={basicChecked} onChange={setBasicChecked} labelClassName="text-purple-600 font-semibold" />
        <NCheck
          label="Large Text Checkbox"
          checked={agreeTerms}
          onChange={setAgreeTerms}
          labelClassName="text-lg font-bold text-blue-600"
          className="py-2"
        />
        <NCheck label="Compact Checkbox" checked={rememberMe} onChange={setRememberMe} labelClassName="text-sm" className="py-1" />
      </NCard>

      {/* Action Buttons */}
      <View className="flex-row gap-2 mt-4">
        <NButton className="flex-1 bg-red-500 border-red-500" onPress={resetAllCheckboxes}>
          Reset All
        </NButton>
        <NButton
          className="flex-1 bg-green-500 border-green-500"
          onPress={() => {
            const allData = {
              basic: { basicChecked, agreeTerms, subscribeNewsletter, enableNotifications, rememberMe, acceptCookies },
              features,
              notifications,
              privacy,
              tasks,
              shoppingList
            };
            console.log('All checkbox data:', allData);
            NToast.success('Settings saved successfully!');
          }}>
          Save All
        </NButton>
      </View>

      {/* Summary Cards */}
      <View className="mt-6 space-y-4">
        <NCard>
          <NText className="text-lg font-bold text-text mb-2">Features Summary</NText>
          <NText className="text-sm text-muted">Enabled: {Object.values(features).filter(Boolean).length}/8 features</NText>
        </NCard>

        <NCard>
          <NText className="text-lg font-bold text-text mb-2">Notifications Summary</NText>
          <NText className="text-sm text-muted">Active: {Object.values(notifications).filter(Boolean).length}/8 notification types</NText>
        </NCard>

        <NCard>
          <NText className="text-lg font-bold text-text mb-2">Privacy Summary</NText>
          <NText className="text-sm text-muted">Permissions granted: {Object.values(privacy).filter(Boolean).length}/8 permissions</NText>
        </NCard>

        <NCard>
          <NText className="text-lg font-bold text-text mb-2">Tasks Summary</NText>
          <NText className="text-sm text-muted">
            Completed: {Object.values(tasks).filter(Boolean).length}/8 tasks ({calculateProgress(tasks)}%)
          </NText>
        </NCard>

        <NCard>
          <NText className="text-lg font-bold text-text mb-2">Shopping Summary</NText>
          <NText className="text-sm text-muted">Selected: {Object.values(shoppingList).filter(Boolean).length}/10 items</NText>
        </NCard>
      </View>

      {/* Help Section */}
      <View className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <NText className="text-blue-800 font-semibold mb-2">💡 Checkbox Best Practices</NText>
        <NText className="text-blue-700 text-sm leading-relaxed">
          • Use checkboxes for multiple selections or binary choices{'\n'}• Provide clear, descriptive labels{'\n'}• Group related checkboxes together
          {'\n'}• Use progress indicators for task lists{'\n'}• Provide visual feedback when items are selected{'\n'}• Consider default states for
          common preferences{'\n'}• Use disabled state for unavailable options{'\n'}• Test accessibility with screen readers and keyboard navigation
        </NText>
      </View>
    </ScrollView>
  );
};

export default Component;
