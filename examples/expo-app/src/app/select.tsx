import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NButton, NCard, NSelect, NText, NToast, SelectOption } from '@nayan-ui/react-native';

const Component = () => {
  // Basic select state
  const [selectedCountry, setSelectedCountry] = useState<SelectOption>({ label: '', value: '' });
  const [selectedLanguage, setSelectedLanguage] = useState<SelectOption>({ label: 'English', value: 'en' });
  const [selectedTheme, setSelectedTheme] = useState<SelectOption>({ label: 'Light', value: 'light' });
  const [selectedCurrency, setSelectedCurrency] = useState<SelectOption>({ label: 'USD', value: 'usd' });
  const [selectedTimeZone, setSelectedTimeZone] = useState<SelectOption>({ label: '', value: '' });
  const [selectedCategory, setSelectedCategory] = useState<SelectOption>({ label: '', value: '' });
  const [selectedPriority, setSelectedPriority] = useState<SelectOption>({ label: 'Medium', value: 'medium' });
  const [selectedStatus, setSelectedStatus] = useState<SelectOption>({ label: 'Active', value: 'active' });

  // Form state
  const [userProfile, setUserProfile] = useState({
    country: { label: '', value: '' },
    state: { label: '', value: '' },
    city: { label: '', value: '' },
    occupation: { label: '', value: '' },
    experience: { label: '', value: '' }
  });

  // Options data
  const countries = [
    { label: 'United States', value: 'us' },
    { label: 'Canada', value: 'ca' },
    { label: 'United Kingdom', value: 'uk' },
    { label: 'Germany', value: 'de' },
    { label: 'France', value: 'fr' },
    { label: 'Japan', value: 'jp' },
    { label: 'Australia', value: 'au' },
    { label: 'India', value: 'in' },
    { label: 'Brazil', value: 'br' },
    { label: 'Mexico', value: 'mx' }
  ];

  const languages = [
    { label: 'English', value: 'en' },
    { label: 'Spanish', value: 'es' },
    { label: 'French', value: 'fr' },
    { label: 'German', value: 'de' },
    { label: 'Chinese', value: 'zh' },
    { label: 'Japanese', value: 'ja' },
    { label: 'Portuguese', value: 'pt' },
    { label: 'Russian', value: 'ru' },
    { label: 'Arabic', value: 'ar' },
    { label: 'Hindi', value: 'hi' }
  ];

  const themes = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'Auto', value: 'auto' },
    { label: 'High Contrast', value: 'high-contrast' },
    { label: 'Sepia', value: 'sepia' }
  ];

  const currencies = [
    { label: 'USD - US Dollar', value: 'usd' },
    { label: 'EUR - Euro', value: 'eur' },
    { label: 'GBP - British Pound', value: 'gbp' },
    { label: 'JPY - Japanese Yen', value: 'jpy' },
    { label: 'CAD - Canadian Dollar', value: 'cad' },
    { label: 'AUD - Australian Dollar', value: 'aud' },
    { label: 'CHF - Swiss Franc', value: 'chf' },
    { label: 'CNY - Chinese Yuan', value: 'cny' }
  ];

  const timeZones = [
    { label: 'UTC-12:00 (Baker Island)', value: 'utc-12' },
    { label: 'UTC-08:00 (Pacific)', value: 'utc-8' },
    { label: 'UTC-05:00 (Eastern)', value: 'utc-5' },
    { label: 'UTC+00:00 (GMT)', value: 'utc+0' },
    { label: 'UTC+01:00 (Central European)', value: 'utc+1' },
    { label: 'UTC+05:30 (India)', value: 'utc+5.5' },
    { label: 'UTC+08:00 (China)', value: 'utc+8' },
    { label: 'UTC+09:00 (Japan)', value: 'utc+9' },
    { label: 'UTC+10:00 (Australia East)', value: 'utc+10' },
    { label: 'UTC+12:00 (New Zealand)', value: 'utc+12' }
  ];

  const categories = [
    { label: 'Technology', value: 'tech' },
    { label: 'Business', value: 'business' },
    { label: 'Design', value: 'design' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Finance', value: 'finance' },
    { label: 'Education', value: 'education' },
    { label: 'Healthcare', value: 'healthcare' },
    { label: 'Entertainment', value: 'entertainment' }
  ];

  const priorities = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Critical', value: 'critical' }
  ];

  const statuses = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Pending', value: 'pending' },
    { label: 'Suspended', value: 'suspended' },
    { label: 'Archived', value: 'archived' }
  ];

  const occupations = [
    { label: 'Software Developer', value: 'developer' },
    { label: 'Designer', value: 'designer' },
    { label: 'Product Manager', value: 'pm' },
    { label: 'Data Scientist', value: 'data-scientist' },
    { label: 'Marketing Manager', value: 'marketing' },
    { label: 'Sales Representative', value: 'sales' },
    { label: 'Teacher', value: 'teacher' },
    { label: 'Doctor', value: 'doctor' },
    { label: 'Engineer', value: 'engineer' },
    { label: 'Consultant', value: 'consultant' }
  ];

  const experienceLevels = [
    { label: 'Entry Level (0-2 years)', value: 'entry' },
    { label: 'Mid Level (3-5 years)', value: 'mid' },
    { label: 'Senior Level (6-10 years)', value: 'senior' },
    { label: 'Lead Level (10+ years)', value: 'lead' },
    { label: 'Executive Level', value: 'executive' }
  ];

  const usStates = [
    { label: 'California', value: 'ca' },
    { label: 'New York', value: 'ny' },
    { label: 'Texas', value: 'tx' },
    { label: 'Florida', value: 'fl' },
    { label: 'Illinois', value: 'il' },
    { label: 'Pennsylvania', value: 'pa' },
    { label: 'Ohio', value: 'oh' },
    { label: 'Georgia', value: 'ga' },
    { label: 'North Carolina', value: 'nc' },
    { label: 'Michigan', value: 'mi' }
  ];

  const cities = [
    { label: 'New York City', value: 'nyc' },
    { label: 'Los Angeles', value: 'la' },
    { label: 'Chicago', value: 'chicago' },
    { label: 'Houston', value: 'houston' },
    { label: 'Phoenix', value: 'phoenix' },
    { label: 'Philadelphia', value: 'philadelphia' },
    { label: 'San Antonio', value: 'san-antonio' },
    { label: 'San Diego', value: 'san-diego' },
    { label: 'Dallas', value: 'dallas' },
    { label: 'San Jose', value: 'san-jose' }
  ];

  const handleCountryChange = (value: SelectOption) => {
    setSelectedCountry(value);
    NToast.info(`Country selected: ${value.label}`);
  };

  const handleLanguageChange = (value: SelectOption) => {
    setSelectedLanguage(value);
    NToast.success(`Language changed to: ${value.label}`);
  };

  const handleThemeChange = (value: SelectOption) => {
    setSelectedTheme(value);
    NToast.info(`Theme changed to: ${value.label}`);
  };

  const updateUserProfile = (field: string, value: SelectOption) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
    NToast.info(`Profile updated: ${field}`);
  };

  const resetSelections = () => {
    setSelectedCountry({ label: '', value: '' });
    setSelectedLanguage({ label: 'English', value: 'en' });
    setSelectedTheme({ label: 'Light', value: 'light' });
    setSelectedCurrency({ label: 'USD', value: 'usd' });
    setSelectedTimeZone({ label: '', value: '' });
    setSelectedCategory({ label: '', value: '' });
    setSelectedPriority({ label: 'Medium', value: 'medium' });
    setSelectedStatus({ label: 'Active', value: 'active' });
    setUserProfile({
      country: { label: '', value: '' },
      state: { label: '', value: '' },
      city: { label: '', value: '' },
      occupation: { label: '', value: '' },
      experience: { label: '', value: '' }
    });
    NToast.success('All selections reset');
  };

  const saveSettings = () => {
    const settings = {
      country: selectedCountry,
      language: selectedLanguage,
      theme: selectedTheme,
      currency: selectedCurrency,
      timeZone: selectedTimeZone,
      category: selectedCategory,
      priority: selectedPriority,
      status: selectedStatus,
      profile: userProfile
    };
    console.log('Settings saved:', settings);
    NToast.success('Settings saved successfully!');
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Basic Select */}
      <NText className="text-xl font-bold mb-3 text-text">Basic Select</NText>
      <NCard className="mb-6">
        <NSelect label="Select Country" placeholder="Choose a country" value={selectedCountry} items={countries} onChange={handleCountryChange} />
      </NCard>

      {/* App Settings */}
      <NText className="text-xl font-bold mb-3 text-text">App Settings</NText>
      <NCard className="mb-6">
        <NSelect
          label="Language"
          selectLabel="Choose Language"
          placeholder="Select language"
          value={selectedLanguage}
          items={languages}
          onChange={handleLanguageChange}
        />
        <NSelect label="Theme" placeholder="Select theme" value={selectedTheme} items={themes} onChange={handleThemeChange} />
        <NSelect label="Currency" placeholder="Select currency" value={selectedCurrency} items={currencies} onChange={setSelectedCurrency} />
        <NSelect
          label="Time Zone"
          placeholder="Select time zone"
          value={selectedTimeZone}
          items={timeZones}
          onChange={value => {
            setSelectedTimeZone(value);
            NToast.info(`Time zone set to: ${value.label}`);
          }}
        />
      </NCard>

      {/* Project Management */}
      <NText className="text-xl font-bold mb-3 text-text">Project Settings</NText>
      <NCard className="mb-6">
        <NSelect
          label="Category"
          placeholder="Select category"
          value={selectedCategory}
          items={categories}
          onChange={value => {
            setSelectedCategory(value);
            NToast.info(`Category: ${value.label}`);
          }}
        />
        <NSelect
          label="Priority Level"
          placeholder="Select priority"
          value={selectedPriority}
          items={priorities}
          onChange={value => {
            setSelectedPriority(value);
            const color = value.value === 'critical' ? 'error' : value.value === 'high' ? 'warning' : 'info';
            NToast.info(`Priority set to: ${value.label}`);
          }}
        />
        <NSelect
          label="Status"
          placeholder="Select status"
          value={selectedStatus}
          items={statuses}
          onChange={value => {
            setSelectedStatus(value);
            NToast.success(`Status updated: ${value.label}`);
          }}
        />
      </NCard>

      {/* User Profile Form */}
      <NText className="text-xl font-bold mb-3 text-text">User Profile</NText>
      <NCard className="mb-6">
        <NSelect
          label="Country"
          placeholder="Select your country"
          value={userProfile.country}
          items={countries}
          onChange={value => updateUserProfile('country', value)}
        />
        <NSelect
          label="State/Province"
          placeholder="Select your state"
          value={userProfile.state}
          items={userProfile.country.value === 'us' ? usStates : []}
          onChange={value => updateUserProfile('state', value)}
          disabled={!userProfile.country.value}
        />
        <NSelect
          label="City"
          placeholder="Select your city"
          value={userProfile.city}
          items={userProfile.state.value ? cities : []}
          onChange={value => updateUserProfile('city', value)}
          disabled={!userProfile.state.value}
        />
        <NSelect
          label="Occupation"
          placeholder="Select your occupation"
          value={userProfile.occupation}
          items={occupations}
          onChange={value => updateUserProfile('occupation', value)}
        />
        <NSelect
          label="Experience Level"
          placeholder="Select experience level"
          value={userProfile.experience}
          items={experienceLevels}
          onChange={value => updateUserProfile('experience', value)}
        />
      </NCard>

      {/* Disabled Select */}
      <NText className="text-xl font-bold mb-3 text-text">Disabled Select</NText>
      <NCard className="mb-6">
        <NSelect
          label="Premium Features (Upgrade Required)"
          placeholder="Premium features locked"
          value={{ label: '', value: '' }}
          items={[
            { label: 'Advanced Analytics', value: 'analytics' },
            { label: 'Custom Themes', value: 'themes' },
            { label: 'Priority Support', value: 'support' }
          ]}
          onChange={() => {}}
          disabled={true}
        />
        <NText className="text-sm text-muted mt-2">Upgrade to premium to access these features.</NText>
      </NCard>

      {/* Custom Styled Select */}
      <NText className="text-xl font-bold mb-3 text-text">Custom Styled</NText>
      <NCard className="mb-6">
        <NSelect
          label="Custom Select"
          placeholder="Choose an option"
          value={selectedCategory}
          items={categories}
          onChange={setSelectedCategory}
          labelClassName="text-purple-600 font-semibold"
          inputClassName="border-purple-300 bg-purple-50"
        />
        <NSelect
          label="Large Select"
          placeholder="Large select field"
          value={selectedPriority}
          items={priorities}
          onChange={setSelectedPriority}
          className="py-2"
          labelClassName="text-lg font-bold"
        />
      </NCard>

      {/* Multiple Selects with Dependencies */}
      <NText className="text-xl font-bold mb-3 text-text">Dependent Selects</NText>
      <NCard className="mb-6">
        <NSelect
          label="Select Country First"
          placeholder="Choose country"
          value={userProfile.country}
          items={countries}
          onChange={value => {
            updateUserProfile('country', value);
            // Reset dependent fields
            setUserProfile(prev => ({
              ...prev,
              country: value,
              state: { label: '', value: '' },
              city: { label: '', value: '' }
            }));
          }}
        />
        <NSelect
          label="Then Select State"
          placeholder={userProfile.country.value ? 'Choose state' : 'Select country first'}
          value={userProfile.state}
          items={userProfile.country.value === 'us' ? usStates : []}
          onChange={value => {
            updateUserProfile('state', value);
            // Reset city when state changes
            setUserProfile(prev => ({
              ...prev,
              state: value,
              city: { label: '', value: '' }
            }));
          }}
          disabled={!userProfile.country.value}
        />
        <NSelect
          label="Finally Select City"
          placeholder={userProfile.state.value ? 'Choose city' : 'Select state first'}
          value={userProfile.city}
          items={userProfile.state.value ? cities : []}
          onChange={value => updateUserProfile('city', value)}
          disabled={!userProfile.state.value}
        />
        <NText className="text-sm text-muted mt-2">Each selection enables the next dropdown in the sequence.</NText>
      </NCard>

      {/* Action Buttons */}
      <View className="flex-row gap-2 mt-4">
        <NButton className="flex-1 bg-red-500 border-red-500" onPress={resetSelections}>
          Reset All
        </NButton>
        <NButton className="flex-1 bg-green-500 border-green-500" onPress={saveSettings}>
          Save Settings
        </NButton>
      </View>

      {/* Selection Summary */}
      <NCard className="mt-6">
        <NText className="text-lg font-bold text-text mb-3">Current Selections</NText>
        <View className="space-y-2">
          <NText className="text-sm text-muted">Country: {selectedCountry.label || 'Not selected'}</NText>
          <NText className="text-sm text-muted">Language: {selectedLanguage.label}</NText>
          <NText className="text-sm text-muted">Theme: {selectedTheme.label}</NText>
          <NText className="text-sm text-muted">Currency: {selectedCurrency.label}</NText>
          <NText className="text-sm text-muted">Time Zone: {selectedTimeZone.label || 'Not selected'}</NText>
          <NText className="text-sm text-muted">Category: {selectedCategory.label || 'Not selected'}</NText>
          <NText className="text-sm text-muted">Priority: {selectedPriority.label}</NText>
          <NText className="text-sm text-muted">Status: {selectedStatus.label}</NText>
        </View>
      </NCard>

      {/* Profile Summary */}
      <NCard className="mt-4">
        <NText className="text-lg font-bold text-text mb-3">Profile Information</NText>
        <View className="space-y-2">
          <NText className="text-sm text-muted">
            Location: {[userProfile.city.label, userProfile.state.label, userProfile.country.label].filter(Boolean).join(', ') || 'Not specified'}
          </NText>
          <NText className="text-sm text-muted">Occupation: {userProfile.occupation.label || 'Not specified'}</NText>
          <NText className="text-sm text-muted">Experience: {userProfile.experience.label || 'Not specified'}</NText>
        </View>
      </NCard>

      {/* Help Section */}
      <View className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <NText className="text-blue-800 font-semibold mb-2">💡 Select Best Practices</NText>
        <NText className="text-blue-700 text-sm leading-relaxed">
          • Use clear, descriptive labels for each select field{'\n'}• Provide helpful placeholder text{'\n'}• Group related options logically{'\n'}•
          Consider search functionality for long lists{'\n'}• Implement dependent selects when appropriate{'\n'}• Disable selects when dependencies
          aren't met{'\n'}• Provide feedback when selections change{'\n'}• Test with keyboard navigation and screen readers
        </NText>
      </View>
    </ScrollView>
  );
};

export default Component;
