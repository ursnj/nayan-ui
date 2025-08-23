import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { NButton, NFormInput } from '@nayan-ui/react';
import { Building, Calendar, Eye, EyeOff, Lock, Mail, MapPin, Phone, User } from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

interface BasicFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  website: string;
  bio: string;
}

interface ValidationFormData {
  username: string;
  email: string;
  password: string;
  age: number;
  website: string;
}

const FormInput = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submissionResults, setSubmissionResults] = useState<{ [key: string]: any }>({});

  // Basic Form
  const basicForm = useForm<BasicFormData>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  // Profile Form
  const profileForm = useForm<ProfileFormData>({
    defaultValues: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      company: 'Acme Corp',
      position: 'Software Engineer',
      website: 'https://johndoe.dev',
      bio: 'Passionate developer with 5+ years of experience'
    }
  });

  // Validation Form
  const validationForm = useForm<ValidationFormData>({
    mode: 'onChange',
    defaultValues: {
      username: '',
      email: '',
      password: '',
      age: 0,
      website: ''
    }
  });

  const onBasicSubmit = (data: BasicFormData) => {
    setSubmissionResults(prev => ({ ...prev, basic: data }));
    console.log('Basic Form Data:', data);
  };

  const onProfileSubmit = (data: ProfileFormData) => {
    setSubmissionResults(prev => ({ ...prev, profile: data }));
    console.log('Profile Form Data:', data);
  };

  const onValidationSubmit = (data: ValidationFormData) => {
    setSubmissionResults(prev => ({ ...prev, validation: data }));
    console.log('Validation Form Data:', data);
  };

  return (
    <ComponentWrapper>
      {/* Basic Form Input */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Basic Form Input</h2>
        <p className="text-muted-foreground mb-4">Simple form with React Hook Form integration.</p>

        <form onSubmit={basicForm.handleSubmit(onBasicSubmit)} className="max-w-md space-y-4">
          <NFormInput
            control={basicForm.control}
            name="email"
            type="email"
            label="Email Address"
            placeholder="Enter your email"
            error={basicForm.formState.errors.email}
            rules={{
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
              }
            }}
          />

          <div className="relative">
            <NFormInput
              control={basicForm.control}
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="Enter your password"
              error={basicForm.formState.errors.password}
              inputClassName="pr-10"
              rules={{
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters long'
                }
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-muted-foreground hover:text-text">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <NFormInput
              control={basicForm.control}
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirm Password"
              placeholder="Confirm your password"
              error={basicForm.formState.errors.confirmPassword}
              inputClassName="pr-10"
              rules={{
                required: 'Please confirm your password',
                validate: value => value === basicForm.watch('password') || 'Passwords do not match'
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9 text-muted-foreground hover:text-text">
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <NButton type="submit" className="w-full" disabled={!basicForm.formState.isValid}>
            Create Account
          </NButton>

          {submissionResults.basic && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Form Submitted Successfully!</h4>
              <pre className="text-sm text-green-700 dark:text-green-300">{JSON.stringify(submissionResults.basic, null, 2)}</pre>
            </div>
          )}
        </form>
      </div>

      {/* Profile Form with Icons */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Profile Form with Icons</h2>
        <p className="text-muted-foreground mb-4">Comprehensive profile form with icon integration.</p>

        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <NFormInput
                control={profileForm.control}
                name="firstName"
                label="First Name"
                placeholder="Enter first name"
                error={profileForm.formState.errors.firstName}
                inputClassName="pl-10"
                rules={{ required: 'First name is required' }}
              />
              <User className="absolute left-3 top-9 w-4 h-4 text-muted-foreground" />
            </div>

            <div className="relative">
              <NFormInput
                control={profileForm.control}
                name="lastName"
                label="Last Name"
                placeholder="Enter last name"
                error={profileForm.formState.errors.lastName}
                inputClassName="pl-10"
                rules={{ required: 'Last name is required' }}
              />
              <User className="absolute left-3 top-9 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <NFormInput
                control={profileForm.control}
                name="email"
                type="email"
                label="Email Address"
                placeholder="Enter email"
                error={profileForm.formState.errors.email}
                inputClassName="pl-10"
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Please enter a valid email address'
                  }
                }}
              />
              <Mail className="absolute left-3 top-9 w-4 h-4 text-muted-foreground" />
            </div>

            <div className="relative">
              <NFormInput
                control={profileForm.control}
                name="phone"
                type="tel"
                label="Phone Number"
                placeholder="Enter phone number"
                error={profileForm.formState.errors.phone}
                inputClassName="pl-10"
              />
              <Phone className="absolute left-3 top-9 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <NFormInput
                control={profileForm.control}
                name="company"
                label="Company"
                placeholder="Enter company name"
                error={profileForm.formState.errors.company}
                inputClassName="pl-10"
              />
              <Building className="absolute left-3 top-9 w-4 h-4 text-muted-foreground" />
            </div>

            <NFormInput
              control={profileForm.control}
              name="position"
              label="Position"
              placeholder="Enter job title"
              error={profileForm.formState.errors.position}
            />
          </div>

          <div className="mb-4">
            <NFormInput
              control={profileForm.control}
              name="website"
              type="url"
              label="Website"
              placeholder="https://example.com"
              error={profileForm.formState.errors.website}
              helperText="Optional: Your personal or company website"
            />
          </div>

          <div className="mb-6">
            <NFormInput
              control={profileForm.control}
              name="bio"
              label="Bio"
              placeholder="Tell us about yourself..."
              error={profileForm.formState.errors.bio}
              helperText="Brief description about yourself (optional)"
            />
          </div>

          <div className="flex space-x-4">
            <NButton type="submit" className="flex-1">
              Update Profile
            </NButton>
            <NButton type="button" isOutline onClick={() => profileForm.reset()}>
              Reset
            </NButton>
          </div>

          {submissionResults.profile && (
            <div className="mt-4 p-4 bg-card border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Profile Updated!</h4>
              <pre className="text-sm text-blue-700 dark:text-blue-300 max-h-40 overflow-y-auto">
                {JSON.stringify(submissionResults.profile, null, 2)}
              </pre>
            </div>
          )}
        </form>
      </div>

      {/* Advanced Validation */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Advanced Validation</h2>
        <p className="text-muted-foreground mb-4">Form with complex validation rules and real-time feedback.</p>

        <form onSubmit={validationForm.handleSubmit(onValidationSubmit)} className="max-w-md space-y-4">
          <NFormInput
            control={validationForm.control}
            name="username"
            label="Username"
            placeholder="Enter username"
            error={validationForm.formState.errors.username}
            helperText="3-20 characters, letters, numbers, and underscores only"
            rules={{
              required: 'Username is required',
              minLength: {
                value: 3,
                message: 'Username must be at least 3 characters long'
              },
              maxLength: {
                value: 20,
                message: 'Username cannot exceed 20 characters'
              },
              pattern: {
                value: /^[a-zA-Z0-9_]+$/,
                message: 'Username can only contain letters, numbers, and underscores'
              }
            }}
          />

          <NFormInput
            control={validationForm.control}
            name="email"
            type="email"
            label="Email Address"
            placeholder="Enter email address"
            error={validationForm.formState.errors.email}
            rules={{
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
              }
            }}
          />

          <NFormInput
            control={validationForm.control}
            name="password"
            type="password"
            label="Password"
            placeholder="Enter a strong password"
            error={validationForm.formState.errors.password}
            helperText="At least 8 characters with uppercase, lowercase, number, and special character"
            rules={{
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters long'
              },
              validate: {
                hasUppercase: value => /[A-Z]/.test(value) || 'Password must contain at least one uppercase letter',
                hasLowercase: value => /[a-z]/.test(value) || 'Password must contain at least one lowercase letter',
                hasNumber: value => /\d/.test(value) || 'Password must contain at least one number',
                hasSpecialChar: value => /[!@#$%^&*(),.?":{}|<>]/.test(value) || 'Password must contain at least one special character'
              }
            }}
          />

          <NFormInput
            control={validationForm.control}
            name="age"
            type="number"
            label="Age"
            placeholder="Enter your age"
            error={validationForm.formState.errors.age}
            rules={{
              required: 'Age is required',
              min: {
                value: 13,
                message: 'You must be at least 13 years old'
              },
              max: {
                value: 120,
                message: 'Please enter a valid age'
              }
            }}
          />

          <NFormInput
            control={validationForm.control}
            name="website"
            type="url"
            label="Website (Optional)"
            placeholder="https://example.com"
            error={validationForm.formState.errors.website}
            rules={{
              pattern: {
                value: /^https?:\/\/.+\..+/,
                message: 'Please enter a valid URL starting with http:// or https://'
              }
            }}
          />

          <div className="flex space-x-4 pt-4">
            <NButton type="submit" className="flex-1" disabled={!validationForm.formState.isValid}>
              Submit
            </NButton>
            <NButton
              type="button"
              isOutline
              onClick={() => {
                validationForm.reset();
                setSubmissionResults(prev => ({ ...prev, validation: null }));
              }}>
              Clear
            </NButton>
          </div>

          {submissionResults.validation && (
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">Validation Passed!</h4>
              <pre className="text-sm text-purple-700 dark:text-purple-300">{JSON.stringify(submissionResults.validation, null, 2)}</pre>
            </div>
          )}
        </form>
      </div>

      {/* Custom Controller Usage */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Custom Controller Usage</h2>
        <p className="text-muted-foreground mb-4">Using Controller component for more control over form inputs.</p>

        <form className="max-w-md space-y-4">
          <Controller
            name="customInput"
            control={validationForm.control}
            rules={{ required: 'This field is required' }}
            render={({ field, fieldState }) => (
              <NFormInput
                {...field}
                label="Custom Controlled Input"
                placeholder="This uses Controller component"
                error={fieldState.error}
                helperText="This input is controlled using the Controller component"
              />
            )}
          />

          <Controller
            name="customEmail"
            control={validationForm.control}
            rules={{
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Invalid email format'
              }
            }}
            render={({ field, fieldState }) => (
              <div className="relative">
                <NFormInput
                  {...field}
                  type="email"
                  label="Custom Email Input"
                  placeholder="Enter email with custom validation"
                  error={fieldState.error}
                  inputClassName="pl-10"
                />
                <Mail className="absolute left-3 top-9 w-4 h-4 text-muted-foreground" />
              </div>
            )}
          />
        </form>
      </div>

      {/* Form States Demo */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Form States</h2>
        <p className="text-muted-foreground mb-4">Different form states and their visual representations.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <div>
            <h3 className="font-medium mb-3">Valid State</h3>
            <NFormInput
              control={profileForm.control}
              name="email"
              type="email"
              label="Valid Email"
              placeholder="valid@example.com"
              inputClassName="border-green-500 focus:ring-green-500"
              helperText="✓ Email format is correct"
            />
          </div>

          <div>
            <h3 className="font-medium mb-3">Error State</h3>
            <NFormInput
              control={validationForm.control}
              name="username"
              label="Invalid Username"
              placeholder="ab"
              error={{ type: 'minLength', message: 'Username must be at least 3 characters long' }}
              inputClassName="border-red-500 focus:ring-red-500"
            />
          </div>

          <div>
            <h3 className="font-medium mb-3">Disabled State</h3>
            <NFormInput
              control={profileForm.control}
              name="firstName"
              label="Disabled Input"
              placeholder="This input is disabled"
              disabled
              inputClassName="bg-card"
            />
          </div>

          <div>
            <h3 className="font-medium mb-3">Loading State</h3>
            <NFormInput
              control={profileForm.control}
              name="lastName"
              label="Loading Input"
              placeholder="Checking availability..."
              disabled
              inputClassName="bg-card"
              helperText="⏳ Validating input..."
            />
          </div>
        </div>
      </div>

      {/* Form Summary */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Form State Summary</h2>
        <p className="text-muted-foreground mb-4">Live summary of all form states and validation status.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-card rounded-lg">
            <h4 className="font-medium mb-2">Basic Form</h4>
            <div className="text-sm space-y-1">
              <p>
                <strong>Valid:</strong> {basicForm.formState.isValid ? '✅' : '❌'}
              </p>
              <p>
                <strong>Dirty:</strong> {basicForm.formState.isDirty ? '✅' : '❌'}
              </p>
              <p>
                <strong>Errors:</strong> {Object.keys(basicForm.formState.errors).length}
              </p>
            </div>
          </div>

          <div className="p-4 bg-card rounded-lg">
            <h4 className="font-medium mb-2">Profile Form</h4>
            <div className="text-sm space-y-1">
              <p>
                <strong>Valid:</strong> {profileForm.formState.isValid ? '✅' : '❌'}
              </p>
              <p>
                <strong>Dirty:</strong> {profileForm.formState.isDirty ? '✅' : '❌'}
              </p>
              <p>
                <strong>Errors:</strong> {Object.keys(profileForm.formState.errors).length}
              </p>
            </div>
          </div>

          <div className="p-4 bg-card rounded-lg">
            <h4 className="font-medium mb-2">Validation Form</h4>
            <div className="text-sm space-y-1">
              <p>
                <strong>Valid:</strong> {validationForm.formState.isValid ? '✅' : '❌'}
              </p>
              <p>
                <strong>Dirty:</strong> {validationForm.formState.isDirty ? '✅' : '❌'}
              </p>
              <p>
                <strong>Errors:</strong> {Object.keys(validationForm.formState.errors).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ComponentWrapper>
  );
};

export default FormInput;
