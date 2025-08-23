import { useState } from 'react';
import { NButton, NCard, NRadioGroup } from '@nayan-ui/react';
import {
  Building2,
  Camera,
  Clock,
  CreditCard,
  Headphones,
  Heart,
  Laptop,
  MapPin,
  Monitor,
  Palette,
  Shield,
  Smartphone,
  Star,
  Truck,
  Users,
  Volume2,
  Wifi,
  Zap
} from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const RadioGroup = () => {
  // Basic examples
  const [basicSelection, setBasicSelection] = useState('business');
  const [orientationSelection, setOrientationSelection] = useState('startup');

  // Advanced examples
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [deliveryOption, setDeliveryOption] = useState('standard');
  const [notificationPreference, setNotificationPreference] = useState('email');
  const [themePreference, setThemePreference] = useState('light');
  const [deviceType, setDeviceType] = useState('laptop');

  // Form examples
  const [surveyAnswers, setSurveyAnswers] = useState({
    satisfaction: 'satisfied',
    recommendation: 'likely',
    frequency: 'weekly'
  });

  const [selectionHistory, setSelectionHistory] = useState<string[]>([]);

  const handleSelectionChange = (category: string, value: string) => {
    setSelectionHistory(prev => [...prev, `${category}: ${value} - ${new Date().toLocaleTimeString()}`]);
  };

  // Data for different examples
  const basicItems = [
    { value: 'startup', label: 'Startup' },
    { value: 'business', label: 'Business' },
    { value: 'enterprise', label: 'Enterprise' }
  ];

  const paymentItems = [
    { value: 'card', label: 'Credit Card', description: 'Pay with your credit or debit card' },
    { value: 'paypal', label: 'PayPal', description: 'Pay securely with your PayPal account' },
    { value: 'bank', label: 'Bank Transfer', description: 'Direct transfer from your bank account' },
    { value: 'crypto', label: 'Cryptocurrency', description: 'Pay with Bitcoin or other cryptocurrencies' }
  ];

  const deliveryItems = [
    { value: 'standard', label: 'Standard Delivery', description: '5-7 business days • Free' },
    { value: 'express', label: 'Express Delivery', description: '2-3 business days • $9.99' },
    { value: 'overnight', label: 'Overnight Delivery', description: 'Next business day • $24.99' },
    { value: 'pickup', label: 'Store Pickup', description: 'Ready in 2 hours • Free' }
  ];

  const notificationItems = [
    { value: 'email', label: 'Email Only', description: 'Receive notifications via email' },
    { value: 'sms', label: 'SMS Only', description: 'Receive notifications via text message' },
    { value: 'both', label: 'Email & SMS', description: 'Receive notifications via both channels' },
    { value: 'none', label: 'No Notifications', description: 'Disable all notifications' }
  ];

  const themeItems = [
    { value: 'light', label: 'Light Theme', description: 'Clean and bright interface' },
    { value: 'dark', label: 'Dark Theme', description: 'Easy on the eyes in low light' },
    { value: 'auto', label: 'Auto Theme', description: 'Matches your system preference' }
  ];

  const deviceItems = [
    { value: 'smartphone', label: 'Smartphone', description: 'Mobile device with touchscreen' },
    { value: 'laptop', label: 'Laptop', description: 'Portable computer with keyboard' },
    { value: 'desktop', label: 'Desktop', description: 'Stationary computer setup' },
    { value: 'tablet', label: 'Tablet', description: 'Touch-enabled portable device' }
  ];

  const satisfactionItems = [
    { value: 'very-satisfied', label: 'Very Satisfied' },
    { value: 'satisfied', label: 'Satisfied' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'dissatisfied', label: 'Dissatisfied' },
    { value: 'very-dissatisfied', label: 'Very Dissatisfied' }
  ];

  const recommendationItems = [
    { value: 'very-likely', label: 'Very Likely' },
    { value: 'likely', label: 'Likely' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'unlikely', label: 'Unlikely' },
    { value: 'very-unlikely', label: 'Very Unlikely' }
  ];

  const frequencyItems = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'rarely', label: 'Rarely' }
  ];

  return (
    <ComponentWrapper>
      {/* Basic Radio Groups */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Basic Radio Groups</h2>
        <p className="text-muted-foreground mb-4">Simple radio groups with horizontal and vertical orientations.</p>

        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-3">Horizontal Layout</h3>
            <NRadioGroup
              items={basicItems}
              value={basicSelection}
              onChange={value => {
                setBasicSelection(value);
                handleSelectionChange('Basic Horizontal', basicItems.find(item => item.value === value)?.label || value);
              }}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Selected: <span className="font-medium">{basicItems.find(item => item.value === basicSelection)?.label}</span>
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-3">Vertical Layout</h3>
            <NRadioGroup
              orientation="vertical"
              items={basicItems}
              value={orientationSelection}
              onChange={value => {
                setOrientationSelection(value);
                handleSelectionChange('Basic Vertical', basicItems.find(item => item.value === value)?.label || value);
              }}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Selected: <span className="font-medium">{basicItems.find(item => item.value === orientationSelection)?.label}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Radio Groups with Descriptions */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Radio Groups with Descriptions</h2>
        <p className="text-muted-foreground mb-4">Radio groups with additional descriptive text for each option.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NCard className="p-4">
            <h3 className="font-medium mb-4 flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>Payment Method</span>
            </h3>
            <NRadioGroup
              orientation="vertical"
              items={paymentItems}
              value={paymentMethod}
              onChange={value => {
                setPaymentMethod(value);
                handleSelectionChange('Payment Method', paymentItems.find(item => item.value === value)?.label || value);
              }}
            />
          </NCard>

          <NCard className="p-4">
            <h3 className="font-medium mb-4 flex items-center space-x-2">
              <Truck className="w-4 h-4" />
              <span>Delivery Options</span>
            </h3>
            <NRadioGroup
              orientation="vertical"
              items={deliveryItems}
              value={deliveryOption}
              onChange={value => {
                setDeliveryOption(value);
                handleSelectionChange('Delivery Option', deliveryItems.find(item => item.value === value)?.label || value);
              }}
            />
          </NCard>
        </div>
      </div>

      {/* Settings Radio Groups */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Settings Radio Groups</h2>
        <p className="text-muted-foreground mb-4">Radio groups commonly used in settings and preferences.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NCard className="p-4">
            <h3 className="font-medium mb-4 flex items-center space-x-2">
              <Volume2 className="w-4 h-4" />
              <span>Notification Preferences</span>
            </h3>
            <NRadioGroup
              orientation="vertical"
              items={notificationItems}
              value={notificationPreference}
              onChange={value => {
                setNotificationPreference(value);
                handleSelectionChange('Notification Preference', notificationItems.find(item => item.value === value)?.label || value);
              }}
            />
          </NCard>

          <NCard className="p-4">
            <h3 className="font-medium mb-4 flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>Theme Preference</span>
            </h3>
            <NRadioGroup
              orientation="vertical"
              items={themeItems}
              value={themePreference}
              onChange={value => {
                setThemePreference(value);
                handleSelectionChange('Theme Preference', themeItems.find(item => item.value === value)?.label || value);
              }}
            />
          </NCard>
        </div>
      </div>

      {/* Device Selection */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Device Selection</h2>
        <p className="text-muted-foreground mb-4">Radio group for selecting device types with icons and descriptions.</p>

        <NCard className="p-4">
          <h3 className="font-medium mb-4 flex items-center space-x-2">
            <Monitor className="w-4 h-4" />
            <span>Primary Device</span>
          </h3>
          <NRadioGroup
            orientation="vertical"
            items={deviceItems}
            value={deviceType}
            onChange={value => {
              setDeviceType(value);
              handleSelectionChange('Device Type', deviceItems.find(item => item.value === value)?.label || value);
            }}
          />

          <div className="mt-4 p-3 bg-card rounded">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-muted-foreground">Selected device:</span>
              <span className="font-medium">{deviceItems.find(item => item.value === deviceType)?.label}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{deviceItems.find(item => item.value === deviceType)?.description}</p>
          </div>
        </NCard>
      </div>

      {/* Survey Form */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Survey Form</h2>
        <p className="text-muted-foreground mb-4">Multiple radio groups in a survey format.</p>

        <NCard className="p-6">
          <h3 className="font-medium mb-6">Customer Satisfaction Survey</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">How satisfied are you with our service?</label>
              <NRadioGroup
                orientation="vertical"
                items={satisfactionItems}
                value={surveyAnswers.satisfaction}
                onChange={value => {
                  setSurveyAnswers(prev => ({ ...prev, satisfaction: value }));
                  handleSelectionChange('Satisfaction', satisfactionItems.find(item => item.value === value)?.label || value);
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">How likely are you to recommend us to a friend?</label>
              <NRadioGroup
                orientation="vertical"
                items={recommendationItems}
                value={surveyAnswers.recommendation}
                onChange={value => {
                  setSurveyAnswers(prev => ({ ...prev, recommendation: value }));
                  handleSelectionChange('Recommendation', recommendationItems.find(item => item.value === value)?.label || value);
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">How often do you use our service?</label>
              <NRadioGroup
                items={frequencyItems}
                value={surveyAnswers.frequency}
                onChange={value => {
                  setSurveyAnswers(prev => ({ ...prev, frequency: value }));
                  handleSelectionChange('Frequency', frequencyItems.find(item => item.value === value)?.label || value);
                }}
              />
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Survey Summary</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Satisfaction:</span>
                  <span className="font-medium">{satisfactionItems.find(item => item.value === surveyAnswers.satisfaction)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recommendation:</span>
                  <span className="font-medium">{recommendationItems.find(item => item.value === surveyAnswers.recommendation)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usage Frequency:</span>
                  <span className="font-medium">{frequencyItems.find(item => item.value === surveyAnswers.frequency)?.label}</span>
                </div>
              </div>
            </div>
          </div>
        </NCard>
      </div>

      {/* Custom Styled Radio Groups */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Custom Styled Radio Groups</h2>
        <p className="text-muted-foreground mb-4">Radio groups with custom styling and visual enhancements.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NCard className="p-4 border-blue-200 bg-card">
            <h3 className="font-medium mb-4 text-blue-800 dark:text-blue-200">Priority Level</h3>
            <NRadioGroup
              orientation="vertical"
              items={[
                { value: 'low', label: 'Low Priority', description: 'Can be addressed later' },
                { value: 'medium', label: 'Medium Priority', description: 'Should be addressed soon' },
                { value: 'high', label: 'High Priority', description: 'Needs immediate attention' },
                { value: 'urgent', label: 'Urgent', description: 'Critical issue requiring immediate action' }
              ]}
              value="medium"
              onChange={value => handleSelectionChange('Priority Level', value)}
            />
          </NCard>

          <NCard className="p-4 border-green-200 bg-green-50 dark:bg-green-900/20">
            <h3 className="font-medium mb-4 text-green-800 dark:text-green-200">Subscription Plan</h3>
            <NRadioGroup
              orientation="vertical"
              items={[
                { value: 'free', label: 'Free Plan', description: 'Basic features • $0/month' },
                { value: 'pro', label: 'Pro Plan', description: 'Advanced features • $9/month' },
                { value: 'team', label: 'Team Plan', description: 'Collaboration tools • $19/month' },
                { value: 'enterprise', label: 'Enterprise', description: 'Custom solutions • Contact us' }
              ]}
              value="pro"
              onChange={value => handleSelectionChange('Subscription Plan', value)}
            />
          </NCard>
        </div>
      </div>

      {/* Radio Group Best Practices */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Radio Group Best Practices</h2>
        <p className="text-muted-foreground mb-4">Guidelines for effective radio group implementation.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NCard className="p-4 border-green-200 bg-green-50 dark:bg-green-900/20">
            <h3 className="font-medium text-green-800 dark:text-green-200 mb-3">✅ Do</h3>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-2">
              <li>• Use for mutually exclusive options</li>
              <li>• Provide clear, descriptive labels</li>
              <li>• Include helpful descriptions when needed</li>
              <li>• Group related options together</li>
              <li>• Set a sensible default selection</li>
              <li>• Use vertical layout for better readability</li>
              <li>• Ensure adequate spacing between options</li>
            </ul>
          </NCard>

          <NCard className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
            <h3 className="font-medium text-red-800 dark:text-red-200 mb-3">❌ Don't</h3>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-2">
              <li>• Use for multiple selections (use checkboxes)</li>
              <li>• Create too many options (consider select)</li>
              <li>• Use vague or ambiguous labels</li>
              <li>• Leave radio groups without default selection</li>
              <li>• Mix different question types in one group</li>
              <li>• Make radio buttons too small to click</li>
              <li>• Forget to handle form validation</li>
            </ul>
          </NCard>
        </div>
      </div>

      {/* Selection History */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Selection History</h2>
        <p className="text-muted-foreground mb-4">Track all radio group selections made above.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NCard className="p-4">
            <h3 className="font-medium mb-3">Recent Selections</h3>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {selectionHistory.length > 0 ? (
                selectionHistory
                  .slice(-10)
                  .reverse()
                  .map((selection, index) => (
                    <div key={index} className="text-sm p-2 bg-card rounded">
                      {selection}
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No selections made yet. Try selecting options above.</p>
              )}
            </div>
          </NCard>

          <NCard className="p-4">
            <h3 className="font-medium mb-3">Current Selections Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Basic Horizontal:</span>
                <span className="font-medium">{basicItems.find(item => item.value === basicSelection)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-medium">{paymentItems.find(item => item.value === paymentMethod)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Option:</span>
                <span className="font-medium">{deliveryItems.find(item => item.value === deliveryOption)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Theme:</span>
                <span className="font-medium">{themeItems.find(item => item.value === themePreference)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Device:</span>
                <span className="font-medium">{deviceItems.find(item => item.value === deviceType)?.label}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground">Total selections: {selectionHistory.length}</div>
              </div>
            </div>
          </NCard>
        </div>
      </div>
    </ComponentWrapper>
  );
};

export default RadioGroup;
