import React, { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NButton, NCard, NInput, NSelect, NSheet, NSwitch, NText, NToast, SelectOption } from '@nayan-ui/react-native';

const Component = () => {
  // Sheet refs
  const basicSheetRef = useRef<any>(null);
  const formSheetRef = useRef<any>(null);
  const settingsSheetRef = useRef<any>(null);
  const actionSheetRef = useRef<any>(null);
  const customSheetRef = useRef<any>(null);
  const profileSheetRef = useRef<any>(null);
  const filterSheetRef = useRef<any>(null);
  const confirmSheetRef = useRef<any>(null);

  // Sheet interaction tracking
  const [sheetActions, setSheetActions] = useState<string[]>([]);

  // Form states
  const [userProfile, setUserProfile] = useState<{
    name: string;
    email: string;
    bio: string;
    notifications: boolean;
    darkMode: boolean;
  }>({
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Software developer passionate about mobile apps',
    notifications: true,
    darkMode: false
  });

  const [contactForm, setContactForm] = useState<{
    name: string;
    email: string;
    subject: string;
    message: string;
  }>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [appSettings, setAppSettings] = useState<{
    autoSave: boolean;
    syncData: boolean;
    showTips: boolean;
    theme: SelectOption;
    language: SelectOption;
  }>({
    autoSave: true,
    syncData: false,
    showTips: true,
    theme: { label: 'Light', value: 'light' },
    language: { label: 'English', value: 'en' }
  });

  const [filterSettings, setFilterSettings] = useState<{
    category: SelectOption;
    sortBy: SelectOption;
    showCompleted: boolean;
    dateRange: SelectOption;
  }>({
    category: { label: 'All', value: 'all' },
    sortBy: { label: 'Date', value: 'date' },
    showCompleted: true,
    dateRange: { label: 'Last 7 days', value: '7days' }
  });

  const addSheetAction = (action: string) => {
    setSheetActions(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${action}`]);
    NToast.info(action);
  };

  const handleProfileSave = () => {
    addSheetAction('Profile updated successfully');
    profileSheetRef.current?.dismiss();
    NToast.success('Profile saved!');
  };

  const handleContactSubmit = () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      NToast.error('Please fill in all required fields');
      return;
    }
    addSheetAction(`Contact form submitted by ${contactForm.name}`);
    setContactForm({ name: '', email: '', subject: '', message: '' });
    formSheetRef.current?.dismiss();
    NToast.success('Message sent successfully!');
  };

  const handleSettingsSave = () => {
    addSheetAction('Settings saved successfully');
    settingsSheetRef.current?.dismiss();
    NToast.success('Settings updated!');
  };

  const handleFilterApply = () => {
    addSheetAction(`Filters applied: ${filterSettings.category.label}, ${filterSettings.sortBy.label}`);
    filterSheetRef.current?.dismiss();
    NToast.success('Filters applied!');
  };

  const handleActionSelection = (action: string) => {
    addSheetAction(`Action selected: ${action}`);
    actionSheetRef.current?.dismiss();
    NToast.success(`${action} completed!`);
  };

  const handleConfirmAction = (confirmed: boolean) => {
    if (confirmed) {
      addSheetAction('Dangerous action confirmed');
      NToast.success('Action completed!');
    } else {
      addSheetAction('Dangerous action cancelled');
      NToast.info('Action cancelled');
    }
    confirmSheetRef.current?.dismiss();
  };

  const clearAllActions = () => {
    setSheetActions([]);
    NToast.success('All actions cleared');
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Basic Sheets */}
      <NText className="text-xl font-bold mb-3 text-text">Basic Sheets</NText>
      <NCard className="mb-6">
        <View className="flex-row gap-3 flex-wrap">
          <NButton
            className="bg-blue-500 border-blue-500"
            onPress={() => {
              basicSheetRef.current?.present();
              addSheetAction('Basic sheet opened');
            }}>
            Basic Sheet
          </NButton>

          <NButton
            className="bg-green-500 border-green-500"
            onPress={() => {
              profileSheetRef.current?.present();
              addSheetAction('Profile sheet opened');
            }}>
            Profile Sheet
          </NButton>

          <NButton
            className="bg-purple-500 border-purple-500"
            onPress={() => {
              formSheetRef.current?.present();
              addSheetAction('Contact form sheet opened');
            }}>
            Contact Form
          </NButton>
        </View>
      </NCard>

      {/* Action & Settings Sheets */}
      <NText className="text-xl font-bold mb-3 text-text">Action & Settings Sheets</NText>
      <NCard className="mb-6">
        <View className="flex-row gap-3 flex-wrap">
          <NButton
            className="bg-orange-500 border-orange-500"
            onPress={() => {
              actionSheetRef.current?.present();
              addSheetAction('Action sheet opened');
            }}>
            Action Sheet
          </NButton>

          <NButton
            className="bg-gray-600 border-gray-600"
            onPress={() => {
              settingsSheetRef.current?.present();
              addSheetAction('Settings sheet opened');
            }}>
            App Settings
          </NButton>

          <NButton
            className="bg-teal-500 border-teal-500"
            onPress={() => {
              filterSheetRef.current?.present();
              addSheetAction('Filter sheet opened');
            }}>
            Filter Options
          </NButton>
        </View>
      </NCard>

      {/* Custom & Confirmation Sheets */}
      <NText className="text-xl font-bold mb-3 text-text">Custom & Confirmation Sheets</NText>
      <NCard className="mb-6">
        <View className="flex-row gap-3 flex-wrap">
          <NButton
            className="bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500"
            onPress={() => {
              customSheetRef.current?.present();
              addSheetAction('Custom styled sheet opened');
            }}>
            Custom Sheet
          </NButton>

          <NButton
            className="bg-red-500 border-red-500"
            onPress={() => {
              confirmSheetRef.current?.present();
              addSheetAction('Confirmation sheet opened');
            }}>
            Confirm Action
          </NButton>
        </View>
      </NCard>

      {/* Basic Sheet */}
      <NSheet sheetRef={basicSheetRef} snapPoints={['50%']}>
        <View className="p-4">
          <NText className="text-xl font-bold text-text mb-4">Welcome!</NText>
          <NText className="text-muted mb-4">This is a basic bottom sheet with simple content. You can swipe down or tap outside to close it.</NText>
          <View className="flex-row gap-2">
            <NButton
              className="flex-1 bg-blue-500 border-blue-500"
              onPress={() => {
                addSheetAction('Basic sheet action completed');
                basicSheetRef.current?.dismiss();
              }}>
              Got it!
            </NButton>
            <NButton
              className="flex-1 bg-gray-500 border-gray-500"
              onPress={() => {
                addSheetAction('Basic sheet dismissed');
                basicSheetRef.current?.dismiss();
              }}>
              Close
            </NButton>
          </View>
        </View>
      </NSheet>

      {/* Profile Sheet */}
      <NSheet sheetRef={profileSheetRef} snapPoints={['70%']}>
        <ScrollView className="flex-1">
          <View className="p-4">
            <NText className="text-xl font-bold text-text mb-4">Edit Profile</NText>

            <NInput
              label="Full Name"
              value={userProfile.name}
              onChangeText={text => setUserProfile(prev => ({ ...prev, name: text }))}
              className="mb-3"
            />

            <NInput
              label="Email Address"
              value={userProfile.email}
              onChangeText={text => setUserProfile(prev => ({ ...prev, email: text }))}
              className="mb-3"
            />

            <NInput label="Bio" value={userProfile.bio} onChangeText={text => setUserProfile(prev => ({ ...prev, bio: text }))} className="mb-4" />

            <View className="flex-row items-center justify-between mb-3">
              <NText className="text-text">Enable Notifications</NText>
              <NSwitch checked={userProfile.notifications} onChange={value => setUserProfile(prev => ({ ...prev, notifications: value }))} />
            </View>

            <View className="flex-row items-center justify-between mb-4">
              <NText className="text-text">Dark Mode</NText>
              <NSwitch checked={userProfile.darkMode} onChange={value => setUserProfile(prev => ({ ...prev, darkMode: value }))} />
            </View>

            <View className="flex-row gap-2">
              <NButton className="flex-1 bg-green-500 border-green-500" onPress={handleProfileSave}>
                Save Changes
              </NButton>
              <NButton
                className="flex-1 bg-gray-500 border-gray-500"
                onPress={() => {
                  addSheetAction('Profile edit cancelled');
                  profileSheetRef.current?.dismiss();
                }}>
                Cancel
              </NButton>
            </View>
          </View>
        </ScrollView>
      </NSheet>

      {/* Contact Form Sheet */}
      <NSheet sheetRef={formSheetRef} snapPoints={['80%']}>
        <ScrollView className="flex-1">
          <View className="p-4">
            <NText className="text-xl font-bold text-text mb-4">Contact Support</NText>

            <NInput
              label="Your Name *"
              value={contactForm.name}
              onChangeText={text => setContactForm(prev => ({ ...prev, name: text }))}
              className="mb-3"
            />

            <NInput
              label="Email Address *"
              value={contactForm.email}
              onChangeText={text => setContactForm(prev => ({ ...prev, email: text }))}
              className="mb-3"
            />

            <NInput
              label="Subject"
              value={contactForm.subject}
              onChangeText={text => setContactForm(prev => ({ ...prev, subject: text }))}
              className="mb-3"
            />

            <NInput
              label="Message *"
              value={contactForm.message}
              onChangeText={text => setContactForm(prev => ({ ...prev, message: text }))}
              className="mb-4"
            />

            <View className="flex-row gap-2">
              <NButton className="flex-1 bg-purple-500 border-purple-500" onPress={handleContactSubmit}>
                Send Message
              </NButton>
              <NButton
                className="flex-1 bg-gray-500 border-gray-500"
                onPress={() => {
                  addSheetAction('Contact form cancelled');
                  formSheetRef.current?.dismiss();
                }}>
                Cancel
              </NButton>
            </View>
          </View>
        </ScrollView>
      </NSheet>

      {/* Action Sheet */}
      <NSheet sheetRef={actionSheetRef} snapPoints={['40%']}>
        <View className="p-4">
          <NText className="text-xl font-bold text-text mb-4">Choose Action</NText>

          <View className="space-y-2">
            <NButton className="w-full bg-blue-500 border-blue-500 mb-2" onPress={() => handleActionSelection('Share')}>
              📤 Share
            </NButton>

            <NButton className="w-full bg-green-500 border-green-500 mb-2" onPress={() => handleActionSelection('Download')}>
              💾 Download
            </NButton>

            <NButton className="w-full bg-yellow-500 border-yellow-500 mb-2" onPress={() => handleActionSelection('Edit')}>
              ✏️ Edit
            </NButton>

            <NButton className="w-full bg-red-500 border-red-500 mb-2" onPress={() => handleActionSelection('Delete')}>
              🗑️ Delete
            </NButton>

            <NButton
              className="w-full bg-gray-500 border-gray-500"
              onPress={() => {
                addSheetAction('Action sheet cancelled');
                actionSheetRef.current?.dismiss();
              }}>
              Cancel
            </NButton>
          </View>
        </View>
      </NSheet>

      {/* Settings Sheet */}
      <NSheet sheetRef={settingsSheetRef} snapPoints={['60%']}>
        <ScrollView className="flex-1">
          <View className="p-4">
            <NText className="text-xl font-bold text-text mb-4">App Settings</NText>

            <View className="flex-row items-center justify-between mb-3">
              <NText className="text-text">Auto Save</NText>
              <NSwitch checked={appSettings.autoSave} onChange={value => setAppSettings(prev => ({ ...prev, autoSave: value }))} />
            </View>

            <View className="flex-row items-center justify-between mb-3">
              <NText className="text-text">Sync Data</NText>
              <NSwitch checked={appSettings.syncData} onChange={value => setAppSettings(prev => ({ ...prev, syncData: value }))} />
            </View>

            <View className="flex-row items-center justify-between mb-4">
              <NText className="text-text">Show Tips</NText>
              <NSwitch checked={appSettings.showTips} onChange={value => setAppSettings(prev => ({ ...prev, showTips: value }))} />
            </View>

            <NSelect
              label="Theme"
              value={appSettings.theme}
              onChange={value => setAppSettings(prev => ({ ...prev, theme: value }))}
              items={[
                { label: 'Light', value: 'light' },
                { label: 'Dark', value: 'dark' },
                { label: 'Auto', value: 'auto' }
              ]}
              className="mb-3"
            />

            <NSelect
              label="Language"
              value={appSettings.language}
              onChange={value => setAppSettings(prev => ({ ...prev, language: value }))}
              items={[
                { label: 'English', value: 'en' },
                { label: 'Spanish', value: 'es' },
                { label: 'French', value: 'fr' },
                { label: 'German', value: 'de' }
              ]}
              className="mb-4"
            />

            <View className="flex-row gap-2">
              <NButton className="flex-1 bg-gray-600 border-gray-600" onPress={handleSettingsSave}>
                Save Settings
              </NButton>
              <NButton
                className="flex-1 bg-gray-500 border-gray-500"
                onPress={() => {
                  addSheetAction('Settings cancelled');
                  settingsSheetRef.current?.dismiss();
                }}>
                Cancel
              </NButton>
            </View>
          </View>
        </ScrollView>
      </NSheet>

      {/* Filter Sheet */}
      <NSheet sheetRef={filterSheetRef} snapPoints={['50%']}>
        <View className="p-4">
          <NText className="text-xl font-bold text-text mb-4">Filter Options</NText>

          <NSelect
            label="Category"
            value={filterSettings.category}
            onChange={value => setFilterSettings(prev => ({ ...prev, category: value }))}
            items={[
              { label: 'All Categories', value: 'all' },
              { label: 'Work', value: 'work' },
              { label: 'Personal', value: 'personal' },
              { label: 'Shopping', value: 'shopping' }
            ]}
            className="mb-3"
          />

          <NSelect
            label="Sort By"
            value={filterSettings.sortBy}
            onChange={value => setFilterSettings(prev => ({ ...prev, sortBy: value }))}
            items={[
              { label: 'Date', value: 'date' },
              { label: 'Name', value: 'name' },
              { label: 'Priority', value: 'priority' },
              { label: 'Status', value: 'status' }
            ]}
            className="mb-3"
          />

          <NSelect
            label="Date Range"
            value={filterSettings.dateRange}
            onChange={value => setFilterSettings(prev => ({ ...prev, dateRange: value }))}
            items={[
              { label: 'Last 7 days', value: '7days' },
              { label: 'Last 30 days', value: '30days' },
              { label: 'Last 3 months', value: '3months' },
              { label: 'All time', value: 'all' }
            ]}
            className="mb-4"
          />

          <View className="flex-row items-center justify-between mb-4">
            <NText className="text-text">Show Completed</NText>
            <NSwitch checked={filterSettings.showCompleted} onChange={value => setFilterSettings(prev => ({ ...prev, showCompleted: value }))} />
          </View>

          <View className="flex-row gap-2">
            <NButton className="flex-1 bg-teal-500 border-teal-500" onPress={handleFilterApply}>
              Apply Filters
            </NButton>
            <NButton
              className="flex-1 bg-gray-500 border-gray-500"
              onPress={() => {
                addSheetAction('Filter cancelled');
                filterSheetRef.current?.dismiss();
              }}>
              Cancel
            </NButton>
          </View>
        </View>
      </NSheet>

      {/* Custom Styled Sheet */}
      <NSheet sheetRef={customSheetRef} snapPoints={['45%']}>
        <View className="p-4 bg-gradient-to-b from-purple-50 to-pink-50">
          <NText className="text-xl font-bold text-purple-800 mb-4">✨ Premium Feature</NText>
          <NText className="text-purple-700 mb-4">
            Unlock premium features with our Pro subscription and get access to advanced tools, priority support, and exclusive content.
          </NText>

          <View className="p-3 bg-white rounded-lg border border-purple-200 mb-4">
            <NText className="text-purple-800 font-semibold mb-2">Premium Benefits:</NText>
            <NText className="text-purple-700 text-sm">
              • Advanced analytics and reporting{'\n'}• Priority customer support{'\n'}• Unlimited cloud storage{'\n'}• Exclusive templates and themes
              {'\n'}• Early access to new features
            </NText>
          </View>

          <View className="flex-row gap-2">
            <NButton
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500"
              onPress={() => {
                addSheetAction('Premium upgrade initiated');
                customSheetRef.current?.dismiss();
                NToast.success('Redirecting to upgrade...');
              }}>
              Upgrade Now
            </NButton>
            <NButton
              className="flex-1 bg-gray-500 border-gray-500"
              onPress={() => {
                addSheetAction('Premium upgrade dismissed');
                customSheetRef.current?.dismiss();
              }}>
              Maybe Later
            </NButton>
          </View>
        </View>
      </NSheet>

      {/* Confirmation Sheet */}
      <NSheet sheetRef={confirmSheetRef} snapPoints={['35%']}>
        <View className="p-4">
          <NText className="text-xl font-bold text-red-600 mb-4">⚠️ Confirm Action</NText>
          <NText className="text-text mb-4">
            Are you sure you want to delete all data? This action cannot be undone and will permanently remove all your information.
          </NText>

          <View className="flex-row gap-2">
            <NButton className="flex-1 bg-red-500 border-red-500" onPress={() => handleConfirmAction(true)}>
              Yes, Delete All
            </NButton>
            <NButton className="flex-1 bg-gray-500 border-gray-500" onPress={() => handleConfirmAction(false)}>
              Cancel
            </NButton>
          </View>
        </View>
      </NSheet>

      {/* Action Buttons */}
      <View className="flex-row gap-2 mt-4">
        <NButton className="flex-1 bg-red-500 border-red-500" onPress={clearAllActions}>
          Clear Actions
        </NButton>
        <NButton
          className="flex-1 bg-green-500 border-green-500"
          onPress={() => {
            const allData = {
              sheetActions,
              userProfile,
              contactForm,
              appSettings,
              filterSettings
            };
            console.log('All sheet data:', allData);
            NToast.success('Sheet data saved!');
          }}>
          Save Data
        </NButton>
      </View>

      {/* Sheet Activity Log */}
      <NCard className="mt-6">
        <NText className="text-lg font-bold text-text mb-3">Sheet Activity Log</NText>
        {sheetActions.length === 0 ? (
          <NText className="text-muted text-sm">No sheet actions yet. Try opening sheets above!</NText>
        ) : (
          <View className="space-y-1">
            {sheetActions.map((action, index) => (
              <NText key={index} className="text-sm text-muted font-mono">
                {action}
              </NText>
            ))}
          </View>
        )}
      </NCard>

      {/* Current Form States */}
      <NCard className="mt-4">
        <NText className="text-lg font-bold text-text mb-3">Current Form States</NText>
        <View className="space-y-2">
          <NText className="text-sm text-muted">
            Profile: {userProfile.name} ({userProfile.email})
          </NText>
          <NText className="text-sm text-muted">
            Settings: Auto-save {appSettings.autoSave ? 'ON' : 'OFF'}, Theme: {appSettings.theme.label}
          </NText>
          <NText className="text-sm text-muted">Contact Form: {contactForm.name ? `${contactForm.name} - ${contactForm.subject}` : 'Empty'}</NText>
          <NText className="text-sm text-muted">
            Filters: {filterSettings.category.label}, Sort: {filterSettings.sortBy.label}
          </NText>
          <NText className="text-sm text-muted">Total Sheet Actions: {sheetActions.length}</NText>
        </View>
      </NCard>

      {/* Help Section */}
      <View className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <NText className="text-blue-800 font-semibold mb-2">💡 Sheet Best Practices</NText>
        <NText className="text-blue-700 text-sm leading-relaxed">
          • Use sheets for secondary content that doesn't require full screen{'\n'}• Set appropriate snap points based on content height{'\n'}•
          Include a clear way to dismiss the sheet{'\n'}• Use sheets for forms, settings, and action menus{'\n'}• Ensure content is scrollable for
          longer forms{'\n'}• Provide visual feedback for user actions{'\n'}• Test sheet behavior on different screen sizes{'\n'}• Consider
          accessibility with proper focus management
        </NText>
      </View>
    </ScrollView>
  );
};

export default Component;
