import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NButtonGroup, NCard, NText, NToast } from '@nayan-ui/react-native';

const Component = () => {
  // Basic business type selection
  const businessTypes = [
    { label: 'Startup', value: 'startup' },
    { label: 'Enterprise', value: 'enterprise' }
  ];
  const [selectedBusiness, setSelectedBusiness] = useState(businessTypes[0].value);

  // Plan selection with pricing
  const planOptions = [
    { label: 'Basic ($9/mo)', value: 'basic' },
    { label: 'Pro ($29/mo)', value: 'pro' },
    { label: 'Enterprise ($99/mo)', value: 'enterprise' }
  ];
  const [selectedPlan, setSelectedPlan] = useState(planOptions[1].value);

  // View mode selection
  const viewModes = [
    { label: 'List', value: 'list' },
    { label: 'Grid', value: 'grid' },
    { label: 'Card', value: 'card' }
  ];
  const [selectedView, setSelectedView] = useState(viewModes[0].value);

  // Time period selection
  const timePeriods = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Year', value: 'year' }
  ];
  const [selectedPeriod, setSelectedPeriod] = useState(timePeriods[2].value);

  // Priority levels
  const priorities = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Critical', value: 'critical' }
  ];
  const [selectedPriority, setSelectedPriority] = useState(priorities[1].value);

  // Status options
  const statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Review', value: 'review' },
    { label: 'Published', value: 'published' }
  ];
  const [selectedStatus, setSelectedStatus] = useState(statusOptions[0].value);

  // Size options
  const sizeOptions = [
    { label: 'XS', value: 'xs' },
    { label: 'S', value: 's' },
    { label: 'M', value: 'm' },
    { label: 'L', value: 'l' },
    { label: 'XL', value: 'xl' }
  ];
  const [selectedSize, setSelectedSize] = useState(sizeOptions[2].value);

  // Theme selection
  const themes = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'Auto', value: 'auto' }
  ];
  const [selectedTheme, setSelectedTheme] = useState(themes[0].value);

  // Selection history
  const [selectionHistory, setSelectionHistory] = useState<Array<{ action: string; timestamp: string }>>([]);

  const addToHistory = (action: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSelectionHistory(prev => [...prev, { action, timestamp }]);
  };

  const handleBusinessChange = (value: string) => {
    setSelectedBusiness(value);
    addToHistory(`Business type: ${businessTypes.find(b => b.value === value)?.label}`);
    NToast.success(`Selected ${businessTypes.find(b => b.value === value)?.label} business type`);
  };

  const handlePlanChange = (value: string) => {
    setSelectedPlan(value);
    addToHistory(`Plan: ${planOptions.find(p => p.value === value)?.label}`);
    NToast.success(`Switched to ${planOptions.find(p => p.value === value)?.label} plan`);
  };

  const handleViewChange = (value: string) => {
    setSelectedView(value);
    addToHistory(`View mode: ${viewModes.find(v => v.value === value)?.label}`);
    NToast.info(`Changed to ${viewModes.find(v => v.value === value)?.label} view`);
  };

  const resetAll = () => {
    setSelectedBusiness(businessTypes[0].value);
    setSelectedPlan(planOptions[1].value);
    setSelectedView(viewModes[0].value);
    setSelectedPeriod(timePeriods[2].value);
    setSelectedPriority(priorities[1].value);
    setSelectedStatus(statusOptions[0].value);
    setSelectedSize(sizeOptions[2].value);
    setSelectedTheme(themes[0].value);
    setSelectionHistory([]);
    NToast.success('All selections reset to defaults');
  };

  return (
    <ScrollView className="flex-1 p-4 bg-background">
      {/* Basic Business Type Selection */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3">Basic Selection</NText>
        <NButtonGroup items={businessTypes} value={selectedBusiness} onChange={handleBusinessChange} label="Choose business type" />
      </NCard>

      {/* Plan Selection with Pricing */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3 ">Pricing Plans</NText>
        <NButtonGroup items={planOptions} value={selectedPlan} onChange={handlePlanChange} label="Select your plan" className="mb-3" />
        <View className="bg-muted rounded-lg p-3">
          <NText className="text-sm ">Current plan: {planOptions.find(p => p.value === selectedPlan)?.label}</NText>
        </View>
      </NCard>

      {/* View Mode Selection */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3 ">Display Options</NText>
        <NButtonGroup items={viewModes} value={selectedView} onChange={handleViewChange} label="View mode" className="mb-3" />
        <NText className="text-sm ">Content will be displayed in {viewModes.find(v => v.value === selectedView)?.label.toLowerCase()} format</NText>
      </NCard>

      {/* Time Period Selection */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3 ">Analytics Period</NText>
        <NButtonGroup
          items={timePeriods}
          value={selectedPeriod}
          onChange={value => {
            setSelectedPeriod(value);
            addToHistory(`Time period: ${timePeriods.find(t => t.value === value)?.label}`);
            NToast.info(`Showing ${timePeriods.find(t => t.value === value)?.label.toLowerCase()} analytics`);
          }}
          label="Select time period"
        />
      </NCard>

      {/* Priority Levels */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3 ">Task Priority</NText>
        <NButtonGroup
          items={priorities}
          value={selectedPriority}
          onChange={value => {
            setSelectedPriority(value);
            addToHistory(`Priority: ${priorities.find(p => p.value === value)?.label}`);
            const priority = priorities.find(p => p.value === value)?.label;
            if (priority === 'Critical') {
              NToast.error(`Set to ${priority} priority`);
            } else if (priority === 'High') {
              NToast.warning(`Set to ${priority} priority`);
            } else {
              NToast.success(`Set to ${priority} priority`);
            }
          }}
          label="Task priority level"
          className="mb-3"
        />
        <View
          className={`rounded-lg p-3 ${
            selectedPriority === 'critical'
              ? 'bg-red-50 border border-red-200'
              : selectedPriority === 'high'
                ? 'bg-orange-50 border border-orange-200'
                : selectedPriority === 'medium'
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-green-50 border border-green-200'
          }`}>
          <NText
            className={`text-sm font-medium ${
              selectedPriority === 'critical'
                ? 'text-red-700'
                : selectedPriority === 'high'
                  ? 'text-orange-700'
                  : selectedPriority === 'medium'
                    ? 'text-yellow-700'
                    : 'text-green-700'
            }`}>
            Current Priority: {priorities.find(p => p.value === selectedPriority)?.label}
          </NText>
        </View>
      </NCard>

      {/* Status Selection */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3 ">Content Status</NText>
        <NButtonGroup
          items={statusOptions}
          value={selectedStatus}
          onChange={value => {
            setSelectedStatus(value);
            addToHistory(`Status: ${statusOptions.find(s => s.value === value)?.label}`);
            NToast.info(`Status changed to ${statusOptions.find(s => s.value === value)?.label}`);
          }}
          label="Content status"
        />
      </NCard>

      {/* Size Selection */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3 ">Size Options</NText>
        <NButtonGroup
          items={sizeOptions}
          value={selectedSize}
          onChange={value => {
            setSelectedSize(value);
            addToHistory(`Size: ${sizeOptions.find(s => s.value === value)?.label}`);
            NToast.success(`Size changed to ${sizeOptions.find(s => s.value === value)?.label}`);
          }}
          label="Select size"
        />
      </NCard>

      {/* Theme Selection */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3 ">Theme Preference</NText>
        <NButtonGroup
          items={themes}
          value={selectedTheme}
          onChange={value => {
            setSelectedTheme(value);
            addToHistory(`Theme: ${themes.find(t => t.value === value)?.label}`);
            NToast.success(`Theme set to ${themes.find(t => t.value === value)?.label}`);
          }}
          label="Choose theme"
        />
      </NCard>

      {/* Disabled Example */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3 ">Disabled State</NText>
        <NButtonGroup items={businessTypes} value={businessTypes[0].value} onChange={() => {}} label="Disabled button group" disabled={true} />
        <NText className="text-sm  mt-2">This button group is disabled and cannot be interacted with</NText>
      </NCard>

      {/* Current Selections Summary */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3 ">Current Selections</NText>
        <View className="bg-muted rounded-lg p-3 space-y-2">
          <View className="flex-row justify-between">
            <NText className="text-sm ">Business:</NText>
            <NText className="text-sm font-medium ">{businessTypes.find(b => b.value === selectedBusiness)?.label}</NText>
          </View>
          <View className="flex-row justify-between">
            <NText className="text-sm ">Plan:</NText>
            <NText className="text-sm font-medium ">{planOptions.find(p => p.value === selectedPlan)?.label}</NText>
          </View>
          <View className="flex-row justify-between">
            <NText className="text-sm ">View:</NText>
            <NText className="text-sm font-medium ">{viewModes.find(v => v.value === selectedView)?.label}</NText>
          </View>
          <View className="flex-row justify-between">
            <NText className="text-sm ">Period:</NText>
            <NText className="text-sm font-medium ">{timePeriods.find(t => t.value === selectedPeriod)?.label}</NText>
          </View>
          <View className="flex-row justify-between">
            <NText className="text-sm ">Priority:</NText>
            <NText className="text-sm font-medium ">{priorities.find(p => p.value === selectedPriority)?.label}</NText>
          </View>
          <View className="flex-row justify-between">
            <NText className="text-sm ">Status:</NText>
            <NText className="text-sm font-medium ">{statusOptions.find(s => s.value === selectedStatus)?.label}</NText>
          </View>
          <View className="flex-row justify-between">
            <NText className="text-sm ">Size:</NText>
            <NText className="text-sm font-medium ">{sizeOptions.find(s => s.value === selectedSize)?.label}</NText>
          </View>
          <View className="flex-row justify-between">
            <NText className="text-sm ">Theme:</NText>
            <NText className="text-sm font-medium ">{themes.find(t => t.value === selectedTheme)?.label}</NText>
          </View>
        </View>
      </NCard>

      {/* Reset Controls */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3 ">Controls</NText>
        <NButtonGroup
          items={[
            { label: 'Reset All', value: 'reset' },
            { label: 'Keep Current', value: 'keep' }
          ]}
          value="keep"
          onChange={value => {
            if (value === 'reset') {
              resetAll();
            }
          }}
          label="Reset options"
        />
      </NCard>

      {/* Selection History */}
      {selectionHistory.length > 0 && (
        <NCard className="p-4 mb-6">
          <NText className="text-lg font-semibold mb-3 ">Selection History</NText>
          <View className="bg-muted rounded-lg p-3 max-h-40">
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectionHistory
                .slice(-8)
                .reverse()
                .map((item, index) => (
                  <View key={index} className="flex-row justify-between items-center py-1">
                    <NText className="text-sm  flex-1">{item.action}</NText>
                    <NText className="text-xs  ml-2">{item.timestamp}</NText>
                  </View>
                ))}
            </ScrollView>
          </View>
          {selectionHistory.length > 8 && (
            <NText className="text-xs  mt-2 text-center">Showing last 8 selections of {selectionHistory.length} total</NText>
          )}
        </NCard>
      )}

      {/* Best Practices */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3 ">Best Practices</NText>
        <View className="space-y-2">
          <NText className="text-sm ">• Use clear, descriptive labels</NText>
          <NText className="text-sm ">• Keep options to 2-5 items when possible</NText>
          <NText className="text-sm ">• Use consistent value naming conventions</NText>
          <NText className="text-sm ">• Provide visual feedback for selections</NText>
          <NText className="text-sm ">• Consider disabled state for unavailable options</NText>
        </View>
      </NCard>
    </ScrollView>
  );
};

export default Component;
