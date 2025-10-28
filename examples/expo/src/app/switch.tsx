import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NButton, NCard, NSwitch, NText, NToast } from '@nayan-ui/react-native';

const Component = () => {
  const [basicSwitch, setBasicSwitch] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [locationServices, setLocationServices] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);
  const [dataSync, setDataSync] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Settings groups
  const [privacySettings, setPrivacySettings] = useState({
    shareData: false,
    trackActivity: true,
    personalizedAds: false,
    cookieConsent: true
  });

  const [accessibilitySettings, setAccessibilitySettings] = useState({
    highContrast: false,
    largeText: false,
    reduceMotion: false,
    screenReader: false
  });

  const updatePrivacySetting = (key: string, value: boolean) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
    NToast.info(`Privacy setting updated: ${key}`);
  };

  const updateAccessibilitySetting = (key: string, value: boolean) => {
    setAccessibilitySettings(prev => ({ ...prev, [key]: value }));
    NToast.info(`Accessibility setting updated: ${key}`);
  };

  const resetAllSettings = () => {
    setBasicSwitch(false);
    setNotificationsEnabled(false);
    setDarkMode(false);
    setLocationServices(false);
    setAutoSave(false);
    setBiometricAuth(false);
    setDataSync(false);
    setOfflineMode(false);
    setAnalyticsEnabled(false);
    setMarketingEmails(false);
    setPrivacySettings({
      shareData: false,
      trackActivity: false,
      personalizedAds: false,
      cookieConsent: false
    });
    setAccessibilitySettings({
      highContrast: false,
      largeText: false,
      reduceMotion: false,
      screenReader: false
    });
    NToast.success('All settings reset to default');
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Basic Switch */}
      <NText className="text-xl font-bold mb-3 text-text">Basic Switch</NText>
      <NSwitch label="Enable Feature" checked={basicSwitch} onChange={setBasicSwitch} className="mb-6" />

      {/* App Settings */}
      <NText className="text-xl font-bold mb-3 text-text">App Settings</NText>
      <NCard className="mb-6">
        <NSwitch
          label="Push Notifications"
          checked={notificationsEnabled}
          onChange={checked => {
            setNotificationsEnabled(checked);
            NToast.success(checked ? 'Notifications enabled' : 'Notifications disabled');
          }}
        />
        <NSwitch
          label="Dark Mode"
          checked={darkMode}
          onChange={checked => {
            setDarkMode(checked);
            NToast.info(checked ? 'Dark mode enabled' : 'Light mode enabled');
          }}
        />
        <NSwitch
          label="Location Services"
          checked={locationServices}
          onChange={checked => {
            setLocationServices(checked);
            NToast.warning(checked ? 'Location access granted' : 'Location access denied');
          }}
        />
        <NSwitch label="Auto-Save Documents" checked={autoSave} onChange={setAutoSave} />
      </NCard>

      {/* Security Settings */}
      <NText className="text-xl font-bold mb-3 text-text">Security Settings</NText>
      <NCard className="mb-6">
        <NSwitch
          label="Biometric Authentication"
          checked={biometricAuth}
          onChange={checked => {
            setBiometricAuth(checked);
            NToast.success(checked ? 'Biometric auth enabled' : 'Biometric auth disabled');
          }}
        />
        <NSwitch label="Data Synchronization" checked={dataSync} onChange={setDataSync} />
        <NSwitch
          label="Offline Mode"
          checked={offlineMode}
          onChange={checked => {
            setOfflineMode(checked);
            if (checked) {
              setDataSync(false); // Auto-disable sync when offline
              NToast.info('Offline mode enabled, sync disabled');
            }
          }}
        />
      </NCard>

      {/* Privacy Settings */}
      <NText className="text-xl font-bold mb-3 text-text">Privacy Settings</NText>
      <NCard className="mb-6">
        <NSwitch label="Share Usage Data" checked={privacySettings.shareData} onChange={checked => updatePrivacySetting('shareData', checked)} />
        <NSwitch
          label="Track Activity"
          checked={privacySettings.trackActivity}
          onChange={checked => updatePrivacySetting('trackActivity', checked)}
        />
        <NSwitch
          label="Personalized Ads"
          checked={privacySettings.personalizedAds}
          onChange={checked => updatePrivacySetting('personalizedAds', checked)}
        />
        <NSwitch
          label="Cookie Consent"
          checked={privacySettings.cookieConsent}
          onChange={checked => updatePrivacySetting('cookieConsent', checked)}
        />
      </NCard>

      {/* Accessibility Settings */}
      <NText className="text-xl font-bold mb-3 text-text">Accessibility Settings</NText>
      <NCard className="mb-6">
        <NSwitch
          label="High Contrast Mode"
          checked={accessibilitySettings.highContrast}
          onChange={checked => updateAccessibilitySetting('highContrast', checked)}
        />
        <NSwitch
          label="Large Text"
          checked={accessibilitySettings.largeText}
          onChange={checked => updateAccessibilitySetting('largeText', checked)}
        />
        <NSwitch
          label="Reduce Motion"
          checked={accessibilitySettings.reduceMotion}
          onChange={checked => updateAccessibilitySetting('reduceMotion', checked)}
        />
        <NSwitch
          label="Screen Reader Support"
          checked={accessibilitySettings.screenReader}
          onChange={checked => updateAccessibilitySetting('screenReader', checked)}
        />
      </NCard>

      {/* Communication Preferences */}
      <NText className="text-xl font-bold mb-3 text-text">Communication</NText>
      <NCard className="mb-6">
        <NSwitch
          label="Analytics & Performance"
          checked={analyticsEnabled}
          onChange={checked => {
            setAnalyticsEnabled(checked);
            NToast.info(checked ? 'Analytics enabled' : 'Analytics disabled');
          }}
        />
        <NSwitch
          label="Marketing Emails"
          checked={marketingEmails}
          onChange={checked => {
            setMarketingEmails(checked);
            NToast.info(checked ? 'Marketing emails enabled' : 'Marketing emails disabled');
          }}
        />
      </NCard>

      {/* Disabled Switch */}
      <NText className="text-xl font-bold mb-3 text-text">Disabled Switch</NText>
      <NCard className="mb-6">
        <NSwitch label="Premium Feature (Upgrade Required)" checked={false} onChange={() => {}} disabled={true} />
        <NText className="text-sm text-muted mt-2 ml-4">This feature requires a premium subscription to enable.</NText>
      </NCard>

      {/* Custom Styled Switches */}
      <NText className="text-xl font-bold mb-3 text-text">Custom Styled</NText>
      <NCard className="mb-6">
        <NSwitch
          label="Custom Colors"
          checked={basicSwitch}
          onChange={setBasicSwitch}
          labelClassName="text-purple-600 font-semibold"
          inputClassName="bg-purple-500"
        />
        <NSwitch label="Large Label" checked={darkMode} onChange={setDarkMode} labelClassName="text-lg font-bold text-blue-600" className="py-4" />
        <NSwitch label="Compact Switch" checked={autoSave} onChange={setAutoSave} className="py-1" labelClassName="text-sm" />
      </NCard>

      {/* Switch with Description */}
      <NText className="text-xl font-bold mb-3 text-text">Switch with Description</NText>
      <NCard className="mb-6">
        <View>
          <NSwitch label="Two-Factor Authentication" checked={biometricAuth} onChange={setBiometricAuth} className="mb-2" />
          <NText className="text-sm text-muted ml-4 leading-relaxed">
            Add an extra layer of security to your account by requiring a second form of authentication when signing in.
          </NText>
        </View>

        <View className="mt-4">
          <NSwitch label="Automatic Backups" checked={dataSync} onChange={setDataSync} className="mb-2" />
          <NText className="text-sm text-muted ml-4 leading-relaxed">
            Automatically backup your data to the cloud daily. This ensures your information is safe and can be restored if needed.
          </NText>
        </View>
      </NCard>

      {/* Switch Groups with Dependency */}
      <NText className="text-xl font-bold mb-3 text-text">Dependent Settings</NText>
      <NCard className="mb-6">
        <NSwitch
          label="Enable Notifications"
          checked={notificationsEnabled}
          onChange={checked => {
            setNotificationsEnabled(checked);
            if (!checked) {
              // Disable all notification types when main toggle is off
              setMarketingEmails(false);
            }
          }}
        />
        <NSwitch
          label="Email Notifications"
          checked={marketingEmails && notificationsEnabled}
          onChange={setMarketingEmails}
          disabled={!notificationsEnabled}
          className={!notificationsEnabled ? 'opacity-50' : ''}
        />
        <NText className="text-sm text-muted ml-4 mt-2">Email notifications require the main notification setting to be enabled.</NText>
      </NCard>

      {/* Action Buttons */}
      <View className="flex-row gap-2 mt-4">
        <NButton className="flex-1 bg-red-500 border-red-500" onPress={resetAllSettings}>
          Reset All Settings
        </NButton>
        <NButton className="flex-1 bg-green-500 border-green-500" onPress={() => NToast.success('Settings saved successfully!')}>
          Save Changes
        </NButton>
      </View>

      {/* Settings Summary */}
      <NCard className="mt-6">
        <NText className="text-lg font-bold text-text mb-3">Settings Summary</NText>
        <NText className="text-sm text-muted leading-relaxed">
          Active Settings:{' '}
          {[
            basicSwitch && 'Basic Feature',
            notificationsEnabled && 'Notifications',
            darkMode && 'Dark Mode',
            locationServices && 'Location',
            autoSave && 'Auto-Save',
            biometricAuth && 'Biometric Auth',
            dataSync && 'Data Sync',
            offlineMode && 'Offline Mode',
            analyticsEnabled && 'Analytics',
            marketingEmails && 'Marketing Emails'
          ]
            .filter(Boolean)
            .join(', ') || 'None'}
        </NText>
      </NCard>

      {/* Help Section */}
      <View className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <NText className="text-blue-800 font-semibold mb-2">💡 Switch Best Practices</NText>
        <NText className="text-blue-700 text-sm leading-relaxed">
          • Use switches for binary on/off settings{'\n'}• Provide clear, descriptive labels for each switch{'\n'}• Group related switches together in
          cards or sections{'\n'}• Consider dependencies between settings (disable related options){'\n'}• Provide descriptions for complex settings
          {'\n'}• Use consistent styling across your application{'\n'}• Test accessibility with screen readers
        </NText>
      </View>
    </ScrollView>
  );
};

export default Component;
