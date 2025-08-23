import { useState } from 'react';
import { NInput } from '@nayan-ui/react';
import { Calendar, DollarSign, Eye, EyeOff, Lock, Mail, MapPin, Phone, Search, User } from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Input = () => {
  const [basicInput, setBasicInput] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('John Doe');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [website, setWebsite] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    if (value && !validateEmail(value)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);

    if (value && value.length < 8) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters long' }));
    } else {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  return (
    <ComponentWrapper>
      {/* Basic Inputs */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Basic Inputs</h2>
        <p className="text-muted-foreground mb-4">Simple input fields with labels and placeholders.</p>

        <div className="space-y-4 max-w-md">
          <NInput
            id="basic-input"
            label="Basic Input"
            placeholder="Enter some text"
            value={basicInput}
            onChange={e => setBasicInput(e.target.value)}
          />

          <NInput id="full-name" label="Full Name" placeholder="Enter your full name" value={fullName} onChange={e => setFullName(e.target.value)} />

          <NInput id="readonly-input" label="Read-only Input" value="This field is read-only" readOnly inputClassName="bg-card" />

          <NInput id="disabled-input" label="Disabled Input" placeholder="This input is disabled" disabled />
        </div>
      </div>

      {/* Input Types */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Input Types</h2>
        <p className="text-muted-foreground mb-4">Different input types for various data formats.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          <NInput
            id="email-input"
            type="email"
            label="Email Address"
            placeholder="Enter your email"
            value={email}
            onChange={handleEmailChange}
            error={errors.email}
          />

          <NInput
            id="phone-input"
            type="tel"
            label="Phone Number"
            placeholder="+1 (555) 123-4567"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
          />

          <NInput
            id="password-input"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={handlePasswordChange}
            error={errors.password}
          />

          <NInput id="date-input" type="date" label="Birth Date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />

          <NInput
            id="number-input"
            type="number"
            label="Amount"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            min="0"
            step="0.01"
          />

          <NInput
            id="url-input"
            type="url"
            label="Website"
            placeholder="https://example.com"
            value={website}
            onChange={e => setWebsite(e.target.value)}
          />

          <NInput
            id="search-input"
            type="search"
            label="Search"
            placeholder="Search for anything..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          <NInput
            id="text-area-like"
            label="Address"
            placeholder="Enter your full address"
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
        </div>
      </div>

      {/* Input with Icons */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Inputs with Icons</h2>
        <p className="text-muted-foreground mb-4">Enhanced inputs with icon elements for better UX.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          <div className="relative">
            <NInput
              id="search-with-icon"
              type="search"
              label="Search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              inputClassName="pl-10"
            />
            <Search className="absolute left-3 top-9 w-4 h-4 text-muted-foreground" />
          </div>

          <div className="relative">
            <NInput
              id="email-with-icon"
              type="email"
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              inputClassName="pl-10"
              error={errors.email}
            />
            <Mail className="absolute left-3 top-9 w-4 h-4 text-muted-foreground" />
          </div>

          <div className="relative">
            <NInput
              id="password-with-icon"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
              inputClassName="pl-10 pr-10"
              error={errors.password}
            />
            <Lock className="absolute left-3 top-9 w-4 h-4 text-muted-foreground" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-muted-foreground hover:text-text">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <NInput id="user-with-icon" label="Username" placeholder="Enter username" inputClassName="pl-10" />
            <User className="absolute left-3 top-9 w-4 h-4 text-muted-foreground" />
          </div>

          <div className="relative">
            <NInput
              id="phone-with-icon"
              type="tel"
              label="Phone"
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              inputClassName="pl-10"
            />
            <Phone className="absolute left-3 top-9 w-4 h-4 text-muted-foreground" />
          </div>

          <div className="relative">
            <NInput
              id="amount-with-icon"
              type="number"
              label="Amount"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              inputClassName="pl-10"
              min="0"
              step="0.01"
            />
            <DollarSign className="absolute left-3 top-9 w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Input States */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Input States</h2>
        <p className="text-muted-foreground mb-4">Different states and validation examples.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          <NInput id="normal-state" label="Normal State" placeholder="This is a normal input" />

          <NInput
            id="focused-state"
            label="Focused State"
            placeholder="Click to see focus state"
            inputClassName="ring-2 ring-blue-500 border-blue-500"
          />

          <NInput
            id="success-state"
            label="Success State"
            placeholder="Valid input"
            value="valid@example.com"
            inputClassName="border-green-500 focus:ring-green-500"
            helperText="Email format is correct"
          />

          <NInput
            id="error-state"
            label="Error State"
            placeholder="Invalid input"
            value="invalid-email"
            error="Please enter a valid email address"
            inputClassName="border-red-500 focus:ring-red-500"
          />

          <NInput
            id="warning-state"
            label="Warning State"
            placeholder="Username"
            value="user123"
            inputClassName="border-yellow-500 focus:ring-yellow-500"
            helperText="Username should be at least 6 characters"
          />

          <NInput
            id="loading-state"
            label="Loading State"
            placeholder="Checking availability..."
            disabled
            inputClassName="bg-card"
            helperText="Validating input..."
          />
        </div>
      </div>

      {/* Input Sizes */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Input Sizes</h2>
        <p className="text-muted-foreground mb-4">Different input sizes for various use cases.</p>

        <div className="space-y-4 max-w-md">
          <NInput id="small-input" label="Small Input" placeholder="Small size input" inputClassName="h-8 text-sm px-2" labelClassName="text-sm" />

          <NInput id="medium-input" label="Medium Input (Default)" placeholder="Medium size input" />

          <NInput id="large-input" label="Large Input" placeholder="Large size input" inputClassName="h-12 text-lg px-4" labelClassName="text-lg" />
        </div>
      </div>

      {/* Custom Styled Inputs */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Custom Styled Inputs</h2>
        <p className="text-muted-foreground mb-4">Inputs with custom styling and themes.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          <NInput id="rounded-input" label="Rounded Input" placeholder="Fully rounded input" inputClassName="rounded-full px-4" />

          <NInput
            id="no-border-input"
            label="Borderless Input"
            placeholder="No border input"
            inputClassName="border-0 border-b-2 border-gray-300 rounded-none focus:ring-0 focus:border-blue-500"
          />

          <NInput
            id="gradient-border"
            label="Gradient Border"
            placeholder="Gradient border input"
            wrapperClassName="relative"
            inputClassName="border-2 border-transparent bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-border"
          />

          <NInput
            id="shadow-input"
            label="Shadow Input"
            placeholder="Input with shadow"
            inputClassName="shadow-lg border-0 focus:ring-2 focus:ring-blue-500"
          />

          <NInput
            id="dark-input"
            label="Dark Theme Input"
            placeholder="Dark themed input"
            inputClassName="bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
            labelClassName="text-white"
          />

          <NInput
            id="colored-input"
            label="Colored Input"
            placeholder="Colored background"
            inputClassName="bg-blue-50 border-blue-200 focus:bg-white focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Form Integration */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Form Integration</h2>
        <p className="text-muted-foreground mb-4">Inputs integrated within a complete form.</p>

        <form className="max-w-md mx-auto p-6 border rounded-lg space-y-4">
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>

          <div className="grid grid-cols-2 gap-4">
            <NInput id="first-name" label="First Name *" placeholder="John" required />
            <NInput id="last-name" label="Last Name *" placeholder="Doe" required />
          </div>

          <NInput
            id="form-email"
            type="email"
            label="Email Address *"
            placeholder="john@example.com"
            value={email}
            onChange={handleEmailChange}
            error={errors.email}
            required
          />

          <NInput
            id="form-phone"
            type="tel"
            label="Phone Number"
            placeholder="+1 (555) 123-4567"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
          />

          <NInput id="company" label="Company" placeholder="Your company name" />

          <NInput id="form-message" label="Message" placeholder="Tell us about your project..." helperText="Optional: Provide additional details" />

          <div className="flex space-x-2 pt-4">
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Submit
            </button>
            <button
              type="reset"
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Input with Helper Text */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Helper Text and Validation</h2>
        <p className="text-muted-foreground mb-4">Inputs with helpful guidance and validation messages.</p>

        <div className="space-y-4 max-w-md">
          <NInput
            id="helper-text-input"
            label="Username"
            placeholder="Enter username"
            helperText="Username must be 3-20 characters long and contain only letters, numbers, and underscores"
          />

          <NInput id="character-count" label="Bio" placeholder="Tell us about yourself" helperText="0/150 characters" maxLength={150} />

          <NInput
            id="required-input"
            label="Required Field *"
            placeholder="This field is required"
            required
            helperText="This field cannot be left empty"
          />

          <NInput
            id="pattern-input"
            label="Product Code"
            placeholder="ABC-123"
            pattern="[A-Z]{3}-[0-9]{3}"
            helperText="Format: ABC-123 (3 letters, dash, 3 numbers)"
          />
        </div>
      </div>

      {/* Real-time Validation */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Real-time Validation</h2>
        <p className="text-muted-foreground mb-4">Inputs with live validation feedback.</p>

        <div className="space-y-4 max-w-md">
          <NInput
            id="live-email"
            type="email"
            label="Email Validation"
            placeholder="Enter your email"
            value={email}
            onChange={handleEmailChange}
            error={errors.email}
            helperText={!errors.email && email ? 'Email format looks good!' : ''}
          />

          <NInput
            id="live-password"
            type="password"
            label="Password Strength"
            placeholder="Enter a strong password"
            value={password}
            onChange={handlePasswordChange}
            error={errors.password}
            helperText={!errors.password && password.length >= 8 ? 'Password strength: Good' : ''}
          />

          <div className="p-4 bg-card rounded-lg">
            <h4 className="font-medium mb-2">Current Values:</h4>
            <div className="text-sm space-y-1">
              <p>
                <strong>Email:</strong> {email || 'Not entered'}
              </p>
              <p>
                <strong>Password:</strong> {'*'.repeat(password.length) || 'Not entered'}
              </p>
              <p>
                <strong>Search:</strong> {searchQuery || 'Not entered'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ComponentWrapper>
  );
};

export default Input;
