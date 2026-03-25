import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NButton, NCard, NRadio, NText, NToast } from '@nayan-ui/react-native';

const Component = () => {
  // Basic radio states
  const [selectedSize, setSelectedSize] = useState('medium');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('credit');
  const [selectedTheme, setSelectedTheme] = useState('light');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedNotification, setSelectedNotification] = useState('all');
  const [selectedPrivacy, setSelectedPrivacy] = useState('public');
  const [selectedDelivery, setSelectedDelivery] = useState('');
  const [selectedSupport, setSelectedSupport] = useState('email');

  // Survey form state
  const [surveyData, setSurveyData] = useState({
    satisfaction: '',
    frequency: '',
    recommendation: '',
    improvement: '',
    experience: ''
  });

  // Options data
  const sizeOptions = [
    { label: 'Small', value: 'small' },
    { label: 'Medium', value: 'medium' },
    { label: 'Large', value: 'large' },
    { label: 'Extra Large', value: 'xl' }
  ];

  const colorOptions = [
    { label: 'Blue', value: 'blue' },
    { label: 'Red', value: 'red' },
    { label: 'Green', value: 'green' },
    { label: 'Purple', value: 'purple' },
    { label: 'Orange', value: 'orange' }
  ];

  const planOptions = [
    { label: 'Free Plan - $0/month', value: 'free' },
    { label: 'Basic Plan - $9/month', value: 'basic' },
    { label: 'Pro Plan - $29/month', value: 'pro' },
    { label: 'Enterprise - $99/month', value: 'enterprise' }
  ];

  const paymentOptions = [
    { label: 'Credit Card', value: 'credit' },
    { label: 'PayPal', value: 'paypal' },
    { label: 'Bank Transfer', value: 'bank' },
    { label: 'Apple Pay', value: 'apple' },
    { label: 'Google Pay', value: 'google' }
  ];

  const themeOptions = [
    { label: 'Light Theme', value: 'light' },
    { label: 'Dark Theme', value: 'dark' },
    { label: 'Auto (System)', value: 'auto' },
    { label: 'High Contrast', value: 'contrast' }
  ];

  const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'Spanish', value: 'es' },
    { label: 'French', value: 'fr' },
    { label: 'German', value: 'de' },
    { label: 'Chinese', value: 'zh' },
    { label: 'Japanese', value: 'ja' }
  ];

  const notificationOptions = [
    { label: 'All Notifications', value: 'all' },
    { label: 'Important Only', value: 'important' },
    { label: 'None', value: 'none' }
  ];

  const privacyOptions = [
    { label: 'Public Profile', value: 'public' },
    { label: 'Friends Only', value: 'friends' },
    { label: 'Private', value: 'private' }
  ];

  const deliveryOptions = [
    { label: 'Standard Delivery (5-7 days) - Free', value: 'standard' },
    { label: 'Express Delivery (2-3 days) - $5', value: 'express' },
    { label: 'Next Day Delivery - $15', value: 'nextday' },
    { label: 'Same Day Delivery - $25', value: 'sameday' }
  ];

  const supportOptions = [
    { label: 'Email Support', value: 'email' },
    { label: 'Phone Support', value: 'phone' },
    { label: 'Live Chat', value: 'chat' },
    { label: 'Help Center Only', value: 'self' }
  ];

  // Survey options
  const satisfactionOptions = [
    { label: 'Very Satisfied', value: 'very-satisfied' },
    { label: 'Satisfied', value: 'satisfied' },
    { label: 'Neutral', value: 'neutral' },
    { label: 'Dissatisfied', value: 'dissatisfied' },
    { label: 'Very Dissatisfied', value: 'very-dissatisfied' }
  ];

  const frequencyOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Rarely', value: 'rarely' },
    { label: 'Never', value: 'never' }
  ];

  const recommendationOptions = [
    { label: 'Definitely', value: 'definitely' },
    { label: 'Probably', value: 'probably' },
    { label: 'Maybe', value: 'maybe' },
    { label: 'Probably Not', value: 'probably-not' },
    { label: 'Definitely Not', value: 'definitely-not' }
  ];

  const improvementOptions = [
    { label: 'User Interface', value: 'ui' },
    { label: 'Performance', value: 'performance' },
    { label: 'Features', value: 'features' },
    { label: 'Documentation', value: 'docs' },
    { label: 'Customer Support', value: 'support' }
  ];

  const experienceOptions = [
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' },
    { label: 'Expert', value: 'expert' }
  ];

  const handleSizeChange = (value: string) => {
    setSelectedSize(value);
    NToast.info(`Size selected: ${value}`);
  };

  const handlePlanChange = (value: string) => {
    setSelectedPlan(value);
    const planName = planOptions.find(p => p.value === value)?.label;
    NToast.success(`Plan selected: ${planName}`);
  };

  const updateSurveyData = (field: string, value: string) => {
    setSurveyData(prev => ({ ...prev, [field]: value }));
    NToast.info(`Survey updated: ${field}`);
  };

  const resetAllSelections = () => {
    setSelectedSize('medium');
    setSelectedColor('blue');
    setSelectedPlan('');
    setSelectedPayment('credit');
    setSelectedTheme('light');
    setSelectedLanguage('en');
    setSelectedNotification('all');
    setSelectedPrivacy('public');
    setSelectedDelivery('');
    setSelectedSupport('email');
    setSurveyData({
      satisfaction: '',
      frequency: '',
      recommendation: '',
      improvement: '',
      experience: ''
    });
    NToast.success('All selections reset');
  };

  const submitSurvey = () => {
    const allAnswered = Object.values(surveyData).every(value => value !== '');
    if (allAnswered) {
      NToast.success('Survey submitted successfully!');
      console.log('Survey data:', surveyData);
    } else {
      NToast.warning('Please answer all survey questions');
    }
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Basic Radio */}
      <NText className="text-xl font-bold mb-3 text-text">Basic Radio Buttons</NText>
      <NCard className="mb-6">
        <NRadio label="Select Size" value={selectedSize} items={sizeOptions} onChange={handleSizeChange} />
      </NCard>

      {/* Color Selection */}
      <NText className="text-xl font-bold mb-3 text-text">Color Selection</NText>
      <NCard className="mb-6">
        <NRadio
          label="Choose Color"
          value={selectedColor}
          items={colorOptions}
          onChange={value => {
            setSelectedColor(value);
            NToast.info(`Color changed to: ${value}`);
          }}
          radioGroupClassName="flex-col gap-2"
        />
      </NCard>

      {/* Subscription Plans */}
      <NText className="text-xl font-bold mb-3 text-text">Subscription Plans</NText>
      <NCard className="mb-6">
        <NRadio label="Choose Your Plan" value={selectedPlan} items={planOptions} onChange={handlePlanChange} radioGroupClassName="flex-col gap-3" />
        {selectedPlan && (
          <View className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <NText className="text-green-800 font-semibold">Selected: {planOptions.find(p => p.value === selectedPlan)?.label}</NText>
          </View>
        )}
      </NCard>

      {/* Payment Methods */}
      <NText className="text-xl font-bold mb-3 text-text">Payment Method</NText>
      <NCard className="mb-6">
        <NRadio
          label="Select Payment Method"
          value={selectedPayment}
          items={paymentOptions}
          onChange={value => {
            setSelectedPayment(value);
            NToast.success(`Payment method: ${value}`);
          }}
          radioGroupClassName="flex-col gap-2"
        />
      </NCard>

      {/* App Preferences */}
      <NText className="text-xl font-bold mb-3 text-text">App Preferences</NText>
      <NCard className="mb-6">
        <NRadio
          label="Theme Preference"
          value={selectedTheme}
          items={themeOptions}
          onChange={value => {
            setSelectedTheme(value);
            NToast.info(`Theme: ${value}`);
          }}
          className="mb-4"
        />
        <NRadio label="Language" value={selectedLanguage} items={languageOptions} onChange={setSelectedLanguage} className="mb-4" />
        <NRadio label="Notifications" value={selectedNotification} items={notificationOptions} onChange={setSelectedNotification} />
      </NCard>

      {/* Privacy Settings */}
      <NText className="text-xl font-bold mb-3 text-text">Privacy Settings</NText>
      <NCard className="mb-6">
        <NRadio
          label="Profile Visibility"
          value={selectedPrivacy}
          items={privacyOptions}
          onChange={value => {
            setSelectedPrivacy(value);
            NToast.info(`Privacy set to: ${value}`);
          }}
          radioGroupClassName="flex-col gap-2"
        />
      </NCard>

      {/* Delivery Options */}
      <NText className="text-xl font-bold mb-3 text-text">Delivery Options</NText>
      <NCard className="mb-6">
        <NRadio
          label="Choose Delivery Speed"
          value={selectedDelivery}
          items={deliveryOptions}
          onChange={value => {
            setSelectedDelivery(value);
            NToast.success(`Delivery option: ${value}`);
          }}
          radioGroupClassName="flex-col gap-3"
        />
      </NCard>

      {/* Support Preferences */}
      <NText className="text-xl font-bold mb-3 text-text">Support Preferences</NText>
      <NCard className="mb-6">
        <NRadio
          label="Preferred Support Channel"
          value={selectedSupport}
          items={supportOptions}
          onChange={setSelectedSupport}
          radioGroupClassName="flex-col gap-2"
        />
      </NCard>

      {/* Disabled Radio */}
      <NText className="text-xl font-bold mb-3 text-text">Disabled Radio</NText>
      <NCard className="mb-6">
        <NRadio
          label="Premium Features (Upgrade Required)"
          value=""
          items={[
            { label: 'Advanced Analytics', value: 'analytics' },
            { label: 'Custom Branding', value: 'branding' },
            { label: 'Priority Support', value: 'priority' }
          ]}
          onChange={() => {}}
          disabled={true}
        />
        <NText className="text-sm text-muted mt-2">These options require a premium subscription.</NText>
      </NCard>

      {/* Custom Styled Radio */}
      <NText className="text-xl font-bold mb-3 text-text">Custom Styled</NText>
      <NCard className="mb-6">
        <NRadio
          label="Custom Colors"
          value={selectedColor}
          items={colorOptions}
          onChange={setSelectedColor}
          labelClassName="text-purple-600 font-semibold"
          radioLabelClassName="text-purple-700"
          radioGroupClassName="flex-col gap-3"
        />
        <NRadio
          label="Compact Layout"
          value={selectedSize}
          items={sizeOptions}
          onChange={setSelectedSize}
          radioGroupClassName="flex-row flex-wrap gap-4"
          className="mt-4"
        />
      </NCard>

      {/* Survey Form */}
      <NText className="text-xl font-bold mb-3 text-text">Customer Survey</NText>
      <NCard className="mb-6">
        <NRadio
          label="1. How satisfied are you with our service?"
          value={surveyData.satisfaction}
          items={satisfactionOptions}
          onChange={value => updateSurveyData('satisfaction', value)}
          radioGroupClassName="flex-col gap-2"
          className="mb-4"
        />
        <NRadio
          label="2. How often do you use our product?"
          value={surveyData.frequency}
          items={frequencyOptions}
          onChange={value => updateSurveyData('frequency', value)}
          radioGroupClassName="flex-col gap-2"
          className="mb-4"
        />
        <NRadio
          label="3. Would you recommend us to others?"
          value={surveyData.recommendation}
          items={recommendationOptions}
          onChange={value => updateSurveyData('recommendation', value)}
          radioGroupClassName="flex-col gap-2"
          className="mb-4"
        />
        <NRadio
          label="4. What area needs the most improvement?"
          value={surveyData.improvement}
          items={improvementOptions}
          onChange={value => updateSurveyData('improvement', value)}
          radioGroupClassName="flex-col gap-2"
          className="mb-4"
        />
        <NRadio
          label="5. What's your experience level?"
          value={surveyData.experience}
          items={experienceOptions}
          onChange={value => updateSurveyData('experience', value)}
          radioGroupClassName="flex-col gap-2"
        />

        <NButton className="mt-4 bg-blue-500 border-blue-500" onPress={submitSurvey}>
          Submit Survey
        </NButton>
      </NCard>

      {/* Action Buttons */}
      <View className="flex-row gap-2 mt-4">
        <NButton className="flex-1 bg-red-500 border-red-500" onPress={resetAllSelections}>
          Reset All
        </NButton>
        <NButton
          className="flex-1 bg-green-500 border-green-500"
          onPress={() => {
            const selections = {
              size: selectedSize,
              color: selectedColor,
              plan: selectedPlan,
              payment: selectedPayment,
              theme: selectedTheme,
              language: selectedLanguage,
              notification: selectedNotification,
              privacy: selectedPrivacy,
              delivery: selectedDelivery,
              support: selectedSupport,
              survey: surveyData
            };
            console.log('All selections:', selections);
            NToast.success('Selections saved!');
          }}>
          Save All
        </NButton>
      </View>

      {/* Selection Summary */}
      <NCard className="mt-6">
        <NText className="text-lg font-bold text-text mb-3">Current Selections</NText>
        <View className="space-y-1">
          <NText className="text-sm text-muted">Size: {selectedSize}</NText>
          <NText className="text-sm text-muted">Color: {selectedColor}</NText>
          <NText className="text-sm text-muted">Plan: {selectedPlan || 'Not selected'}</NText>
          <NText className="text-sm text-muted">Payment: {selectedPayment}</NText>
          <NText className="text-sm text-muted">Theme: {selectedTheme}</NText>
          <NText className="text-sm text-muted">Language: {selectedLanguage}</NText>
          <NText className="text-sm text-muted">Notifications: {selectedNotification}</NText>
          <NText className="text-sm text-muted">Privacy: {selectedPrivacy}</NText>
          <NText className="text-sm text-muted">Delivery: {selectedDelivery || 'Not selected'}</NText>
          <NText className="text-sm text-muted">Support: {selectedSupport}</NText>
        </View>
      </NCard>

      {/* Survey Progress */}
      <NCard className="mt-4">
        <NText className="text-lg font-bold text-text mb-3">Survey Progress</NText>
        <View className="space-y-1">
          <NText className="text-sm text-muted">Completed: {Object.values(surveyData).filter(v => v !== '').length}/5 questions</NText>
          <NText className="text-sm text-muted">Progress: {Math.round((Object.values(surveyData).filter(v => v !== '').length / 5) * 100)}%</NText>
        </View>
      </NCard>

      {/* Help Section */}
      <View className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <NText className="text-blue-800 font-semibold mb-2">💡 Radio Button Best Practices</NText>
        <NText className="text-blue-700 text-sm leading-relaxed">
          • Use radio buttons for mutually exclusive choices{'\n'}• Provide clear, descriptive labels{'\n'}• Group related options together{'\n'}• Use
          vertical layout for better readability{'\n'}• Consider default selections for common choices{'\n'}• Limit options to 7 or fewer when
          possible{'\n'}• Provide feedback when selections change{'\n'}• Test accessibility with screen readers and keyboard navigation
        </NText>
      </View>
    </ScrollView>
  );
};

export default Component;
