import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NButton, NCard, NDialog, NInput, NSelect, NSwitch, NText, NToast } from '@nayan-ui/react-native';

const Component = () => {
  // Dialog interaction tracking
  const [dialogActions, setDialogActions] = useState<string[]>([]);

  // Form states
  const [userProfile, setUserProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Software developer passionate about mobile apps',
    notifications: true,
    darkMode: false,
    language: 'en'
  });

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [settingsForm, setSettingsForm] = useState({
    autoSave: true,
    syncData: false,
    showTips: true,
    theme: 'light',
    fontSize: 'medium'
  });

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: ''
  });

  const addDialogAction = (action: string) => {
    setDialogActions(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${action}`]);
    NToast.info(action);
  };

  const handleProfileSave = () => {
    addDialogAction('Profile updated successfully');
    NToast.success('Profile saved!');
  };

  const handleContactSubmit = () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      NToast.error('Please fill in all required fields');
      return;
    }
    addDialogAction(`Contact form submitted by ${contactForm.name}`);
    setContactForm({ name: '', email: '', subject: '', message: '' });
    NToast.success('Message sent successfully!');
  };

  const handleSettingsSave = () => {
    addDialogAction('Settings saved successfully');
    NToast.success('Settings updated!');
  };

  const handlePaymentSubmit = () => {
    if (!paymentForm.cardNumber || !paymentForm.expiryDate || !paymentForm.cvv) {
      NToast.error('Please fill in all payment details');
      return;
    }
    addDialogAction('Payment processed successfully');
    setPaymentForm({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      billingAddress: ''
    });
    NToast.success('Payment completed!');
  };

  const handleDeleteConfirm = () => {
    addDialogAction('Item deleted permanently');
    NToast.success('Item deleted successfully');
  };

  const handleLogoutConfirm = () => {
    addDialogAction('User logged out');
    NToast.info('Logged out successfully');
  };

  const clearAllActions = () => {
    setDialogActions([]);
    NToast.success('All actions cleared');
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Basic Dialogs */}
      <NText className="text-xl font-bold mb-3 text-text">Basic Dialogs</NText>
      <NCard className="mb-6">
        <View className="flex-row gap-3 flex-wrap">
          <NDialog trigger={<NButton className="bg-blue-500 border-blue-500">Simple Dialog</NButton>} title="Welcome">
            <View className="p-4">
              <NText className="text-text mb-4">Welcome to our application! This is a simple dialog with basic content.</NText>
              <NButton className="bg-blue-500 border-blue-500" onPress={() => addDialogAction('Welcome dialog acknowledged')}>
                Got it!
              </NButton>
            </View>
          </NDialog>

          <NDialog trigger={<NButton className="bg-green-500 border-green-500">Info Dialog</NButton>} title="Information">
            <View className="p-4">
              <NText className="text-text mb-2 font-semibold">App Version: 2.1.0</NText>
              <NText className="text-muted text-sm mb-4">
                • New features added{'\n'}• Bug fixes and improvements{'\n'}• Enhanced user experience{'\n'}• Better performance
              </NText>
              <View className="flex-row gap-2">
                <NButton className="flex-1 bg-green-500 border-green-500" onPress={() => addDialogAction('Release notes viewed')}>
                  View Details
                </NButton>
                <NButton className="flex-1 bg-gray-500 border-gray-500" onPress={() => addDialogAction('Info dialog closed')}>
                  Close
                </NButton>
              </View>
            </View>
          </NDialog>

          <NDialog trigger={<NButton className="bg-orange-500 border-orange-500">Warning Dialog</NButton>} title="⚠️ Warning">
            <View className="p-4">
              <NText className="text-orange-600 mb-4">
                Your storage is almost full. Please free up some space to continue using the app effectively.
              </NText>
              <View className="flex-row gap-2">
                <NButton className="flex-1 bg-orange-500 border-orange-500" onPress={() => addDialogAction('Storage cleanup initiated')}>
                  Clean Up
                </NButton>
                <NButton className="flex-1 bg-gray-500 border-gray-500" onPress={() => addDialogAction('Warning dismissed')}>
                  Later
                </NButton>
              </View>
            </View>
          </NDialog>
        </View>
      </NCard>

      {/* Form Dialogs */}
      <NText className="text-xl font-bold mb-3 text-text">Form Dialogs</NText>
      <NCard className="mb-6">
        <View className="flex-row gap-3 flex-wrap">
          <NDialog
            trigger={<NButton className="bg-purple-500 border-purple-500">Edit Profile</NButton>}
            title="Edit Profile"
            className="sm:max-w-[500px]">
            <View className="p-4">
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
                <NSwitch value={userProfile.notifications} onValueChange={value => setUserProfile(prev => ({ ...prev, notifications: value }))} />
              </View>

              <View className="flex-row items-center justify-between mb-4">
                <NText className="text-text">Dark Mode</NText>
                <NSwitch value={userProfile.darkMode} onValueChange={value => setUserProfile(prev => ({ ...prev, darkMode: value }))} />
              </View>

              <View className="flex-row gap-2">
                <NButton className="flex-1 bg-purple-500 border-purple-500" onPress={handleProfileSave}>
                  Save Changes
                </NButton>
                <NButton className="flex-1 bg-gray-500 border-gray-500" onPress={() => addDialogAction('Profile edit cancelled')}>
                  Cancel
                </NButton>
              </View>
            </View>
          </NDialog>

          <NDialog
            trigger={<NButton className="bg-teal-500 border-teal-500">Contact Us</NButton>}
            title="Contact Support"
            className="sm:max-w-[500px]">
            <View className="p-4">
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
                <NButton className="flex-1 bg-teal-500 border-teal-500" onPress={handleContactSubmit}>
                  Send Message
                </NButton>
                <NButton className="flex-1 bg-gray-500 border-gray-500" onPress={() => addDialogAction('Contact form cancelled')}>
                  Cancel
                </NButton>
              </View>
            </View>
          </NDialog>

          <NDialog
            trigger={<NButton className="bg-indigo-500 border-indigo-500">Payment</NButton>}
            title="💳 Payment Details"
            className="sm:max-w-[500px]">
            <View className="p-4">
              <NInput
                label="Card Number *"
                value={paymentForm.cardNumber}
                onChangeText={text => setPaymentForm(prev => ({ ...prev, cardNumber: text }))}
                placeholder="1234 5678 9012 3456"
                className="mb-3"
              />
              <View className="flex-row gap-2 mb-3">
                <NInput
                  label="Expiry Date *"
                  value={paymentForm.expiryDate}
                  onChangeText={text => setPaymentForm(prev => ({ ...prev, expiryDate: text }))}
                  placeholder="MM/YY"
                  className="flex-1"
                />
                <NInput
                  label="CVV *"
                  value={paymentForm.cvv}
                  onChangeText={text => setPaymentForm(prev => ({ ...prev, cvv: text }))}
                  placeholder="123"
                  className="flex-1"
                />
              </View>
              <NInput
                label="Cardholder Name"
                value={paymentForm.cardholderName}
                onChangeText={text => setPaymentForm(prev => ({ ...prev, cardholderName: text }))}
                className="mb-3"
              />
              <NInput
                label="Billing Address"
                value={paymentForm.billingAddress}
                onChangeText={text => setPaymentForm(prev => ({ ...prev, billingAddress: text }))}
                className="mb-4"
              />

              <View className="flex-row gap-2">
                <NButton className="flex-1 bg-indigo-500 border-indigo-500" onPress={handlePaymentSubmit}>
                  Process Payment
                </NButton>
                <NButton className="flex-1 bg-gray-500 border-gray-500" onPress={() => addDialogAction('Payment cancelled')}>
                  Cancel
                </NButton>
              </View>
            </View>
          </NDialog>
        </View>
      </NCard>

      {/* Confirmation Dialogs */}
      <NText className="text-xl font-bold mb-3 text-text">Confirmation Dialogs</NText>
      <NCard className="mb-6">
        <View className="flex-row gap-3 flex-wrap">
          <NDialog trigger={<NButton className="bg-red-500 border-red-500">Delete Item</NButton>} title="🗑️ Confirm Delete">
            <View className="p-4">
              <NText className="text-text mb-4">Are you sure you want to delete this item? This action cannot be undone.</NText>
              <View className="flex-row gap-2">
                <NButton className="flex-1 bg-red-500 border-red-500" onPress={handleDeleteConfirm}>
                  Delete
                </NButton>
                <NButton className="flex-1 bg-gray-500 border-gray-500" onPress={() => addDialogAction('Delete cancelled')}>
                  Cancel
                </NButton>
              </View>
            </View>
          </NDialog>

          <NDialog trigger={<NButton className="bg-yellow-500 border-yellow-500">Sign Out</NButton>} title="Sign Out">
            <View className="p-4">
              <NText className="text-text mb-4">Are you sure you want to sign out? You'll need to sign in again to access your account.</NText>
              <View className="flex-row gap-2">
                <NButton className="flex-1 bg-yellow-500 border-yellow-500" onPress={handleLogoutConfirm}>
                  Sign Out
                </NButton>
                <NButton className="flex-1 bg-gray-500 border-gray-500" onPress={() => addDialogAction('Sign out cancelled')}>
                  Stay Signed In
                </NButton>
              </View>
            </View>
          </NDialog>

          <NDialog trigger={<NButton className="bg-blue-600 border-blue-600">Save Changes</NButton>} title="💾 Save Changes">
            <View className="p-4">
              <NText className="text-text mb-4">You have unsaved changes. Would you like to save them before continuing?</NText>
              <View className="flex-row gap-2">
                <NButton className="flex-1 bg-blue-600 border-blue-600" onPress={() => addDialogAction('Changes saved')}>
                  Save
                </NButton>
                <NButton className="flex-1 bg-red-500 border-red-500" onPress={() => addDialogAction('Changes discarded')}>
                  Discard
                </NButton>
                <NButton className="flex-1 bg-gray-500 border-gray-500" onPress={() => addDialogAction('Save cancelled')}>
                  Cancel
                </NButton>
              </View>
            </View>
          </NDialog>
        </View>
      </NCard>

      {/* Settings Dialog */}
      <NText className="text-xl font-bold mb-3 text-text">Settings Dialog</NText>
      <NCard className="mb-6">
        <NDialog
          trigger={<NButton className="bg-gray-600 border-gray-600">App Settings</NButton>}
          title="⚙️ Application Settings"
          className="sm:max-w-[500px]">
          <View className="p-4">
            <View className="flex-row items-center justify-between mb-3">
              <NText className="text-text">Auto Save</NText>
              <NSwitch value={settingsForm.autoSave} onValueChange={value => setSettingsForm(prev => ({ ...prev, autoSave: value }))} />
            </View>

            <View className="flex-row items-center justify-between mb-3">
              <NText className="text-text">Sync Data</NText>
              <NSwitch value={settingsForm.syncData} onValueChange={value => setSettingsForm(prev => ({ ...prev, syncData: value }))} />
            </View>

            <View className="flex-row items-center justify-between mb-4">
              <NText className="text-text">Show Tips</NText>
              <NSwitch value={settingsForm.showTips} onValueChange={value => setSettingsForm(prev => ({ ...prev, showTips: value }))} />
            </View>

            <NSelect
              label="Theme"
              value={settingsForm.theme}
              onValueChange={value => setSettingsForm(prev => ({ ...prev, theme: value }))}
              options={[
                { label: 'Light', value: 'light' },
                { label: 'Dark', value: 'dark' },
                { label: 'Auto', value: 'auto' }
              ]}
              className="mb-3"
            />

            <NSelect
              label="Font Size"
              value={settingsForm.fontSize}
              onValueChange={value => setSettingsForm(prev => ({ ...prev, fontSize: value }))}
              options={[
                { label: 'Small', value: 'small' },
                { label: 'Medium', value: 'medium' },
                { label: 'Large', value: 'large' }
              ]}
              className="mb-4"
            />

            <View className="flex-row gap-2">
              <NButton className="flex-1 bg-gray-600 border-gray-600" onPress={handleSettingsSave}>
                Save Settings
              </NButton>
              <NButton className="flex-1 bg-gray-500 border-gray-500" onPress={() => addDialogAction('Settings cancelled')}>
                Cancel
              </NButton>
            </View>
          </View>
        </NDialog>
      </NCard>

      {/* Custom Styled Dialogs */}
      <NText className="text-xl font-bold mb-3 text-text">Custom Styled Dialogs</NText>
      <NCard className="mb-6">
        <View className="flex-row gap-3 flex-wrap">
          <NDialog
            trigger={<NButton className="bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500">Gradient Dialog</NButton>}
            title="✨ Premium Feature"
            className="sm:max-w-[400px] bg-gradient-to-b from-purple-50 to-pink-50 border-purple-200"
            headerClassName="bg-gradient-to-r from-purple-500 to-pink-500"
            headerTitleClassName="text-white font-bold">
            <View className="p-4">
              <NText className="text-purple-800 mb-4">
                Unlock premium features with our Pro subscription and get access to advanced tools and priority support.
              </NText>
              <View className="flex-row gap-2">
                <NButton
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500"
                  onPress={() => addDialogAction('Premium upgrade initiated')}>
                  Upgrade Now
                </NButton>
                <NButton className="flex-1 bg-gray-500 border-gray-500" onPress={() => addDialogAction('Premium upgrade dismissed')}>
                  Maybe Later
                </NButton>
              </View>
            </View>
          </NDialog>

          <NDialog
            trigger={<NButton className="bg-gray-800 border-gray-800 text-white">Dark Dialog</NButton>}
            title="🌙 Dark Mode"
            className="sm:max-w-[400px] bg-gray-800 border-gray-700"
            headerClassName="bg-gray-900"
            headerTitleClassName="text-gray-100">
            <View className="p-4">
              <NText className="text-gray-200 mb-4">
                Experience our app in dark mode for better viewing in low-light conditions and reduced eye strain.
              </NText>
              <View className="flex-row gap-2">
                <NButton
                  className="flex-1 bg-gray-700 border-gray-600"
                  textClassName="text-gray-100"
                  onPress={() => addDialogAction('Dark mode enabled')}>
                  Enable Dark Mode
                </NButton>
                <NButton
                  className="flex-1 bg-gray-600 border-gray-500"
                  textClassName="text-gray-100"
                  onPress={() => addDialogAction('Dark mode dismissed')}>
                  Not Now
                </NButton>
              </View>
            </View>
          </NDialog>

          <NDialog
            trigger={<NButton className="bg-green-600 border-green-600">Success Dialog</NButton>}
            title="✅ Success"
            className="sm:max-w-[400px] bg-green-50 border-green-200"
            headerClassName="bg-green-500"
            headerTitleClassName="text-white">
            <View className="p-4">
              <NText className="text-green-800 mb-4">Your operation completed successfully! All changes have been saved and synchronized.</NText>
              <NButton className="bg-green-600 border-green-600" onPress={() => addDialogAction('Success acknowledged')}>
                Awesome!
              </NButton>
            </View>
          </NDialog>
        </View>
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
              dialogActions,
              userProfile,
              contactForm,
              settingsForm,
              paymentForm
            };
            console.log('All dialog data:', allData);
            NToast.success('Dialog data saved!');
          }}>
          Save Data
        </NButton>
      </View>

      {/* Dialog Activity Log */}
      <NCard className="mt-6">
        <NText className="text-lg font-bold text-text mb-3">Dialog Activity Log</NText>
        {dialogActions.length === 0 ? (
          <NText className="text-muted text-sm">No dialog actions yet. Try interacting with dialogs above!</NText>
        ) : (
          <View className="space-y-1">
            {dialogActions.map((action, index) => (
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
            Settings: Auto-save {settingsForm.autoSave ? 'ON' : 'OFF'}, Theme: {settingsForm.theme}
          </NText>
          <NText className="text-sm text-muted">Contact Form: {contactForm.name ? `${contactForm.name} - ${contactForm.subject}` : 'Empty'}</NText>
          <NText className="text-sm text-muted">Payment: {paymentForm.cardNumber ? 'Card details entered' : 'No payment info'}</NText>
          <NText className="text-sm text-muted">Total Dialog Actions: {dialogActions.length}</NText>
        </View>
      </NCard>

      {/* Help Section */}
      <View className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <NText className="text-blue-800 font-semibold mb-2">💡 Dialog Best Practices</NText>
        <NText className="text-blue-700 text-sm leading-relaxed">
          • Use dialogs for focused tasks that require user attention{'\n'}• Keep dialog content concise and relevant{'\n'}• Provide clear action
          buttons with descriptive labels{'\n'}• Use appropriate dialog sizes for content{'\n'}• Include validation for form dialogs{'\n'}• Use
          confirmation dialogs for destructive actions{'\n'}• Ensure dialogs are accessible with proper focus management{'\n'}• Test dialog behavior
          on different screen sizes
        </NText>
      </View>
    </ScrollView>
  );
};

export default Component;
