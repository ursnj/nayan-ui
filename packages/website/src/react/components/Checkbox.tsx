import { useState } from 'react';
import { NCheck, NLink } from '@nayan-ui/react';
import { Check, Minus, X } from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Checkbox = () => {
  const [basicChecked, setBasicChecked] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true
  });
  const [features, setFeatures] = useState({
    darkMode: false,
    autoSave: true,
    notifications: false,
    analytics: true
  });

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleFeatureChange = (key: keyof typeof features) => {
    setFeatures(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <ComponentWrapper>
      {/* Basic Checkboxes */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Basic Checkboxes</h2>
        <p className="text-muted-foreground mb-4">Simple checkbox with different states and labels.</p>

        <div className="space-y-4">
          <NCheck checked={basicChecked} onChange={setBasicChecked}>
            Basic checkbox
          </NCheck>

          <NCheck checked={true} onChange={() => {}}>
            Checked checkbox
          </NCheck>

          <NCheck checked={false} onChange={() => {}}>
            Unchecked checkbox
          </NCheck>

          <NCheck checked={false} disabled={true} onChange={() => {}}>
            Disabled checkbox
          </NCheck>

          <NCheck checked={true} disabled={true} onChange={() => {}}>
            Disabled checked checkbox
          </NCheck>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Terms and Conditions</h2>
        <p className="text-muted-foreground mb-4">Checkbox with links and rich content in labels.</p>

        <div className="space-y-4">
          <NCheck checked={termsAccepted} onChange={setTermsAccepted}>
            I accept the <NLink className="text-blue-500 hover:underline">terms and conditions</NLink> and{' '}
            <NLink className="text-blue-500 hover:underline">privacy policy</NLink>
          </NCheck>

          <NCheck checked={false} onChange={() => {}}>
            Subscribe to our newsletter for updates and promotions
          </NCheck>

          <NCheck checked={false} onChange={() => {}}>
            I am 18 years or older and agree to the <NLink className="text-blue-500 hover:underline">age verification policy</NLink>
          </NCheck>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Notification Settings</h2>
        <p className="text-muted-foreground mb-4">Group of related checkboxes for settings configuration.</p>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-3">Choose your notification preferences:</h3>
            <div className="space-y-2 ml-4">
              <NCheck checked={notifications.email} onChange={() => handleNotificationChange('email')}>
                Email notifications
              </NCheck>

              <NCheck checked={notifications.sms} onChange={() => handleNotificationChange('sms')}>
                SMS notifications
              </NCheck>

              <NCheck checked={notifications.push} onChange={() => handleNotificationChange('push')}>
                Push notifications
              </NCheck>
            </div>
          </div>

          <div className="mt-4 p-3 bg-card rounded-md">
            <p className="text-sm text-muted-foreground">
              Current settings:{' '}
              {Object.entries(notifications)
                .filter(([_, value]) => value)
                .map(([key, _]) => key)
                .join(', ') || 'None selected'}
            </p>
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Feature Toggles</h2>
        <p className="text-muted-foreground mb-4">Checkboxes for enabling/disabling application features.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <NCheck checked={features.darkMode} onChange={() => handleFeatureChange('darkMode')}>
              <div className="flex items-center space-x-2">
                <span>Dark mode</span>
                <span className="text-xs text-muted-foreground">(Beta)</span>
              </div>
            </NCheck>

            <NCheck checked={features.autoSave} onChange={() => handleFeatureChange('autoSave')}>
              Auto-save documents
            </NCheck>
          </div>

          <div className="space-y-3">
            <NCheck checked={features.notifications} onChange={() => handleFeatureChange('notifications')}>
              Desktop notifications
            </NCheck>

            <NCheck checked={features.analytics} onChange={() => handleFeatureChange('analytics')}>
              <div>
                <div>Usage analytics</div>
                <div className="text-xs text-muted-foreground">Help us improve the app</div>
              </div>
            </NCheck>
          </div>
        </div>
      </div>

      {/* Custom Styled Checkboxes */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Custom Styled Checkboxes</h2>
        <p className="text-muted-foreground mb-4">Checkboxes with custom styling and colors.</p>

        <div className="space-y-4">
          <NCheck checked={true} onChange={() => {}} checkClassName="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500">
            Success checkbox (green)
          </NCheck>

          <NCheck checked={true} onChange={() => {}} checkClassName="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500">
            Error checkbox (red)
          </NCheck>

          <NCheck
            checked={true}
            onChange={() => {}}
            checkClassName="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500 rounded-full">
            Rounded checkbox (purple)
          </NCheck>

          <NCheck
            checked={true}
            onChange={() => {}}
            checkClassName="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-500 data-[state=checked]:border-transparent">
            Gradient checkbox
          </NCheck>
        </div>
      </div>

      {/* Checkbox Lists */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Checkbox Lists</h2>
        <p className="text-muted-foreground mb-4">Lists of checkboxes for multiple selections.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Select your interests:</h3>
            <div className="space-y-2">
              {['Technology', 'Design', 'Business', 'Marketing', 'Development'].map(interest => (
                <NCheck key={interest} checked={false} onChange={() => {}}>
                  {interest}
                </NCheck>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Programming languages:</h3>
            <div className="space-y-2">
              {['JavaScript', 'TypeScript', 'Python', 'Java', 'Go'].map(lang => (
                <NCheck key={lang} checked={['JavaScript', 'TypeScript'].includes(lang)} onChange={() => {}}>
                  {lang}
                </NCheck>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Form Integration */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Form Integration</h2>
        <p className="text-muted-foreground mb-4">Checkboxes integrated within forms with validation.</p>

        <form className="space-y-4 p-4 border rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-2">Account Settings</label>
            <div className="space-y-2">
              <NCheck checked={true} onChange={() => {}}>
                Keep me signed in
              </NCheck>

              <NCheck checked={false} onChange={() => {}}>
                Enable two-factor authentication
              </NCheck>

              <NCheck checked={false} onChange={() => {}}>
                Allow data export
              </NCheck>
            </div>
          </div>

          <div className="pt-4 border-t">
            <NCheck checked={termsAccepted} onChange={setTermsAccepted} className={!termsAccepted ? 'text-red-600' : ''}>
              I agree to the terms of service *
            </NCheck>
            {!termsAccepted && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>

          <button
            type="submit"
            disabled={!termsAccepted}
            className={`px-4 py-2 rounded-md text-sm ${
              termsAccepted ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}>
            Save Settings
          </button>
        </form>
      </div>

      {/* Accessibility Example */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Accessibility</h2>
        <p className="text-muted-foreground mb-4">Checkboxes with proper ARIA attributes and keyboard support.</p>

        <div className="space-y-4">
          <fieldset className="border rounded-lg p-4">
            <legend className="px-2 font-medium">Accessibility preferences</legend>
            <div className="space-y-2 mt-2">
              <NCheck id="high-contrast" checked={false} onChange={() => {}}>
                <label htmlFor="high-contrast">Enable high contrast mode</label>
              </NCheck>

              <NCheck id="large-text" checked={false} onChange={() => {}}>
                <label htmlFor="large-text">Use large text</label>
              </NCheck>

              <NCheck id="reduced-motion" checked={false} onChange={() => {}}>
                <label htmlFor="reduced-motion">Reduce motion and animations</label>
              </NCheck>
            </div>
          </fieldset>

          <div className="text-xs text-muted-foreground">
            <p>• Use Tab to navigate between checkboxes</p>
            <p>• Use Space to toggle checkbox state</p>
            <p>• Screen readers will announce checkbox labels and states</p>
          </div>
        </div>
      </div>

      {/* Interactive Demo */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Interactive Demo</h2>
        <p className="text-muted-foreground mb-4">Real-time checkbox interactions with state display.</p>

        <div className="p-4 border rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Select options:</h3>
              <div className="space-y-2">
                <NCheck checked={basicChecked} onChange={setBasicChecked}>
                  Option 1
                </NCheck>

                <NCheck checked={termsAccepted} onChange={setTermsAccepted}>
                  Option 2
                </NCheck>

                <NCheck checked={notifications.email} onChange={() => handleNotificationChange('email')}>
                  Option 3
                </NCheck>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Current state:</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  {basicChecked ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500" />}
                  <span>Option 1: {basicChecked ? 'Checked' : 'Unchecked'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {termsAccepted ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500" />}
                  <span>Option 2: {termsAccepted ? 'Checked' : 'Unchecked'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {notifications.email ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500" />}
                  <span>Option 3: {notifications.email ? 'Checked' : 'Unchecked'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ComponentWrapper>
  );
};

export default Checkbox;
