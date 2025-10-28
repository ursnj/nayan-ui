import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NButton, NInput, NText, NToast } from '@nayan-ui/react-native';

const Component = () => {
  const [basicInput, setBasicInput] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [multiline, setMultiline] = useState('');
  const [number, setNumber] = useState('');
  const [search, setSearch] = useState('');
  const [url, setUrl] = useState('');
  const [secureEntry, setSecureEntry] = useState(true);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = () => {
    if (!basicInput.trim()) {
      NToast.error('Name is required');
      return;
    }
    if (!validateEmail(email)) {
      NToast.error('Please enter a valid email');
      return;
    }
    if (password.length < 6) {
      NToast.error('Password must be at least 6 characters');
      return;
    }
    NToast.success('Form submitted successfully!');
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Basic Input */}
      <NText className="text-lg font-semibold mb-3 text-text">Basic Input</NText>
      <NInput label="Full Name" value={basicInput} onChangeText={setBasicInput} placeholder="Enter your full name" className="mb-4" />

      {/* Email Input */}
      <NText className="text-lg font-semibold mb-3 text-text">Email Input</NText>
      <NInput
        label="Email Address"
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        inputClassName={!validateEmail(email) && email.length > 0 ? 'border-red-500' : ''}
        className="mb-4"
      />
      {!validateEmail(email) && email.length > 0 && <NText className="text-red-500 text-sm mb-4 -mt-2">Please enter a valid email address</NText>}

      {/* Password Input */}
      <NText className="text-lg font-semibold mb-3 text-text">Password Input</NText>
      <View className="mb-4">
        <NInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry={secureEntry}
          inputClassName={password.length > 0 && password.length < 6 ? 'border-red-500' : ''}
        />
        <NButton
          className="mt-2 bg-transparent border-0 self-start px-0"
          textClassName="text-primary text-sm"
          onPress={() => setSecureEntry(!secureEntry)}>
          {secureEntry ? 'Show Password' : 'Hide Password'}
        </NButton>
        {password.length > 0 && password.length < 6 && <NText className="text-red-500 text-sm mt-1">Password must be at least 6 characters</NText>}
      </View>

      {/* Phone Input */}
      <NText className="text-lg font-semibold mb-3 text-text">Phone Input</NText>
      <NInput
        label="Phone Number"
        value={phone}
        onChangeText={setPhone}
        placeholder="+1 (555) 123-4567"
        keyboardType="phone-pad"
        autoComplete="tel"
        className="mb-4"
      />

      {/* Number Input */}
      <NText className="text-lg font-semibold mb-3 text-text">Number Input</NText>
      <NInput label="Age" value={number} onChangeText={setNumber} placeholder="Enter your age" keyboardType="numeric" className="mb-4" />

      {/* URL Input */}
      <NText className="text-lg font-semibold mb-3 text-text">URL Input</NText>
      <NInput
        label="Website"
        value={url}
        onChangeText={setUrl}
        placeholder="https://example.com"
        keyboardType="url"
        autoCapitalize="none"
        autoComplete="url"
        className="mb-4"
      />

      {/* Search Input */}
      <NText className="text-lg font-semibold mb-3 text-text">Search Input</NText>
      <NInput label="Search" value={search} onChangeText={setSearch} placeholder="Search for anything..." returnKeyType="search" className="mb-4" />

      {/* Multiline Input */}
      <NText className="text-lg font-semibold mb-3 text-text">Multiline Input</NText>
      <NInput
        label="Comments"
        value={multiline}
        onChangeText={setMultiline}
        placeholder="Enter your comments here..."
        multiline
        numberOfLines={4}
        inputClassName="h-24 text-top"
        className="mb-4"
      />

      {/* Disabled Input */}
      <NText className="text-lg font-semibold mb-3 text-text">Disabled Input</NText>
      <NInput label="Disabled Field" value="This field is disabled" onChangeText={() => {}} disabled className="mb-4" />

      {/* Custom Styled Input */}
      <NText className="text-lg font-semibold mb-3 text-text">Custom Styled</NText>
      <NInput
        label="Custom Input"
        value={basicInput}
        onChangeText={setBasicInput}
        placeholder="Custom styled input"
        labelClassName="text-purple-600 font-bold"
        inputClassName="border-2 border-purple-500 rounded-lg bg-purple-50"
        className="mb-4"
      />

      {/* Input with Character Count */}
      <NText className="text-lg font-semibold mb-3 text-text">Input with Character Limit</NText>
      <View className="mb-4">
        <NInput
          label="Bio (Max 100 characters)"
          value={multiline}
          onChangeText={text => {
            if (text.length <= 100) {
              setMultiline(text);
            }
          }}
          placeholder="Tell us about yourself..."
          multiline
          numberOfLines={3}
          inputClassName="h-20"
        />
        <NText className="text-sm text-muted mt-1 text-right">{multiline.length}/100 characters</NText>
      </View>

      {/* Required Fields */}
      <NText className="text-lg font-semibold mb-3 text-text">Required Fields</NText>
      <NInput
        label="Required Field *"
        value={basicInput}
        onChangeText={setBasicInput}
        placeholder="This field is required"
        labelClassName="text-text"
        inputClassName={!basicInput.trim() ? 'border-red-300' : 'border-green-500'}
        className="mb-4"
      />

      {/* Form Actions */}
      <View className="flex-row gap-2 mt-4">
        <NButton className="flex-1" onPress={handleSubmit}>
          Submit Form
        </NButton>
        <NButton
          className="flex-1 bg-transparent border-border"
          textClassName="text-text"
          onPress={() => {
            setBasicInput('');
            setEmail('');
            setPassword('');
            setPhone('');
            setMultiline('');
            setNumber('');
            setSearch('');
            setUrl('');
            NToast.info('Form cleared');
          }}>
          Clear All
        </NButton>
      </View>
    </ScrollView>
  );
};

export default Component;
