import { useState } from 'react';
import { NButton, NCard, NSelect } from '@nayan-ui/react';
import {
  Book,
  Briefcase,
  Building2,
  Camera,
  Car,
  Code,
  Coffee,
  CreditCard,
  Gamepad2,
  Globe,
  GraduationCap,
  Heart,
  Home,
  MapPin,
  Music,
  Palette,
  Plane,
  Settings,
  ShoppingCart,
  Star,
  Users
} from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Select = () => {
  // Basic examples
  const [singleSelect, setSingleSelect] = useState<{ value: string; label: string } | null>(null);
  const [multiSelect, setMultiSelect] = useState<{ value: string; label: string }[]>([]);
  const [creatableSelect, setCreatableSelect] = useState<{ value: string; label: string } | null>(null);

  // Advanced examples
  const [countrySelect, setCountrySelect] = useState<{ value: string; label: string } | null>(null);
  const [skillsSelect, setSkillsSelect] = useState<{ value: string; label: string }[]>([]);
  const [departmentSelect, setDepartmentSelect] = useState<{ value: string; label: string } | null>(null);
  const [tagsSelect, setTagsSelect] = useState<{ value: string; label: string }[]>([]);
  const [prioritySelect, setPrioritySelect] = useState<{ value: string; label: string } | null>(null);

  // Form examples
  const [profileData, setProfileData] = useState<{
    country: { value: string; label: string } | null;
    skills: { value: string; label: string }[];
    interests: { value: string; label: string }[];
    experience: { value: string; label: string } | null;
  }>({
    country: null,
    skills: [],
    interests: [],
    experience: null
  });

  const [selectionHistory, setSelectionHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectionChange = (category: string, value: { value: string; label: string } | { value: string; label: string }[] | null) => {
    const displayValue = Array.isArray(value) ? value.map(v => v.label).join(', ') : value?.label || 'None';
    setSelectionHistory(prev => [...prev, `${category}: ${displayValue} - ${new Date().toLocaleTimeString()}`]);
  };

  // Simulate loading state
  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  // Data for different examples
  const basicOptions = [
    { value: 'startup', label: 'Startup' },
    { value: 'business', label: 'Business' },
    { value: 'enterprise', label: 'Enterprise' },
    { value: 'nonprofit', label: 'Non-profit' }
  ];

  const countryOptions = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'jp', label: 'Japan' },
    { value: 'au', label: 'Australia' },
    { value: 'in', label: 'India' },
    { value: 'br', label: 'Brazil' },
    { value: 'mx', label: 'Mexico' }
  ];

  const skillsOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue.js' },
    { value: 'angular', label: 'Angular' },
    { value: 'node', label: 'Node.js' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'csharp', label: 'C#' },
    { value: 'php', label: 'PHP' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' }
  ];

  const departmentOptions = [
    { value: 'engineering', label: 'Engineering' },
    { value: 'design', label: 'Design' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'sales', label: 'Sales' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'finance', label: 'Finance' },
    { value: 'operations', label: 'Operations' },
    { value: 'support', label: 'Customer Support' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const interestOptions = [
    { value: 'technology', label: 'Technology' },
    { value: 'design', label: 'Design' },
    { value: 'music', label: 'Music' },
    { value: 'photography', label: 'Photography' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'reading', label: 'Reading' },
    { value: 'travel', label: 'Travel' },
    { value: 'cooking', label: 'Cooking' },
    { value: 'sports', label: 'Sports' },
    { value: 'art', label: 'Art' }
  ];

  const experienceOptions = [
    { value: 'entry', label: 'Entry Level (0-2 years)' },
    { value: 'mid', label: 'Mid Level (3-5 years)' },
    { value: 'senior', label: 'Senior Level (6-10 years)' },
    { value: 'lead', label: 'Lead/Principal (10+ years)' }
  ];

  // Grouped options
  const groupedOptions = [
    {
      label: 'Frontend',
      options: [
        { value: 'react', label: 'React' },
        { value: 'vue', label: 'Vue.js' },
        { value: 'angular', label: 'Angular' },
        { value: 'svelte', label: 'Svelte' }
      ]
    },
    {
      label: 'Backend',
      options: [
        { value: 'node', label: 'Node.js' },
        { value: 'python', label: 'Python' },
        { value: 'java', label: 'Java' },
        { value: 'go', label: 'Go' }
      ]
    },
    {
      label: 'Database',
      options: [
        { value: 'postgresql', label: 'PostgreSQL' },
        { value: 'mongodb', label: 'MongoDB' },
        { value: 'mysql', label: 'MySQL' },
        { value: 'redis', label: 'Redis' }
      ]
    }
  ];

  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <ComponentWrapper>
      {/* Basic Select Examples */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Basic Select Examples</h2>
        <p className="text-muted-foreground mb-4">Simple select components with single and multiple selection.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Single Select</h3>
            <NSelect
              label="Business Type"
              placeholder="Select business type..."
              isClearable={true}
              isSearchable={true}
              value={singleSelect}
              options={basicOptions}
              onChangeOptions={(value: { value: string; label: string } | null) => {
                setSingleSelect(value);
                handleSelectionChange('Single Select', value);
              }}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Selected: <span className="font-medium">{singleSelect?.label || 'None'}</span>
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-3">Multi Select</h3>
            <NSelect
              isMulti={true}
              label="Business Types"
              placeholder="Select multiple types..."
              isClearable={true}
              isSearchable={true}
              value={multiSelect}
              options={basicOptions}
              onChangeOptions={(values: { value: string; label: string }[]) => {
                setMultiSelect(values);
                handleSelectionChange('Multi Select', values);
              }}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Selected: <span className="font-medium">{multiSelect.length > 0 ? multiSelect.map(item => item.label).join(', ') : 'None'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Creatable Select */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Creatable Select</h2>
        <p className="text-muted-foreground mb-4">Select component that allows creating new options on the fly.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Create New Tags</h3>
            <NSelect
              isCreatable={true}
              isMulti={true}
              label="Project Tags"
              placeholder="Select or create tags..."
              isClearable={true}
              isSearchable={true}
              value={tagsSelect}
              options={[
                { value: 'frontend', label: 'Frontend' },
                { value: 'backend', label: 'Backend' },
                { value: 'mobile', label: 'Mobile' },
                { value: 'api', label: 'API' }
              ]}
              onCreateOption={(inputValue: string) => {
                const newOption = { value: inputValue.toLowerCase(), label: inputValue };
                setTagsSelect(prev => [...prev, newOption]);
                handleSelectionChange('Created Tag', newOption);
              }}
              onChangeOptions={(values: { value: string; label: string }[]) => {
                setTagsSelect(values);
                handleSelectionChange('Tags Select', values);
              }}
            />
            <p className="text-sm text-muted-foreground mt-2">Type and press Enter to create new tags</p>
          </div>

          <div>
            <h3 className="font-medium mb-3">Single Creatable</h3>
            <NSelect
              isCreatable={true}
              label="Custom Category"
              placeholder="Select or create category..."
              isClearable={true}
              isSearchable={true}
              value={creatableSelect}
              options={[
                { value: 'work', label: 'Work' },
                { value: 'personal', label: 'Personal' },
                { value: 'hobby', label: 'Hobby' }
              ]}
              onCreateOption={(inputValue: string) => {
                const newOption = { value: inputValue.toLowerCase(), label: inputValue };
                setCreatableSelect(newOption);
                handleSelectionChange('Created Category', newOption);
              }}
              onChangeOptions={(value: { value: string; label: string } | null) => {
                setCreatableSelect(value);
                handleSelectionChange('Creatable Select', value);
              }}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Selected: <span className="font-medium">{creatableSelect?.label || 'None'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Select with Loading State */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Select with Loading State</h2>
        <p className="text-muted-foreground mb-4">Select component with loading state simulation.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NCard className="p-4">
            <h3 className="font-medium mb-4 flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>Country Selection</span>
            </h3>
            <NSelect
              label="Country"
              placeholder="Select your country..."
              isClearable={true}
              isSearchable={true}
              isLoading={isLoading}
              value={countrySelect}
              options={countryOptions}
              onChangeOptions={(value: { value: string; label: string } | null) => {
                setCountrySelect(value);
                handleSelectionChange('Country', value);
              }}
            />
            <NButton className="mt-3" onClick={simulateLoading} isLoading={isLoading} loadingText="Loading countries...">
              Simulate Loading
            </NButton>
          </NCard>

          <NCard className="p-4">
            <h3 className="font-medium mb-4 flex items-center space-x-2">
              <Code className="w-4 h-4" />
              <span>Skills Selection</span>
            </h3>
            <NSelect
              isMulti={true}
              label="Technical Skills"
              placeholder="Select your skills..."
              isClearable={true}
              isSearchable={true}
              value={skillsSelect}
              options={skillsOptions}
              onChangeOptions={(values: { value: string; label: string }[]) => {
                setSkillsSelect(values);
                handleSelectionChange('Skills', values);
              }}
            />
            <p className="text-sm text-muted-foreground mt-2">
              {skillsSelect.length} skill{skillsSelect.length !== 1 ? 's' : ''} selected
            </p>
          </NCard>
        </div>
      </div>

      {/* Disabled Select */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Disabled Select</h2>
        <p className="text-muted-foreground mb-4">Select components in disabled state.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Disabled with Value</h3>
            <NSelect
              label="Department"
              placeholder="Select department..."
              isDisabled={true}
              value={{ value: 'engineering', label: 'Engineering' }}
              options={departmentOptions}
              onChangeOptions={() => {}}
            />
            <p className="text-sm text-muted-foreground mt-2">This select is disabled with a pre-selected value</p>
          </div>

          <div>
            <h3 className="font-medium mb-3">Disabled without Value</h3>
            <NSelect
              label="Priority Level"
              placeholder="Select priority..."
              isDisabled={true}
              value={null}
              options={priorityOptions}
              onChangeOptions={() => {}}
            />
            <p className="text-sm text-muted-foreground mt-2">This select is disabled without any value</p>
          </div>
        </div>
      </div>

      {/* Grouped Options */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Grouped Options</h2>
        <p className="text-muted-foreground mb-4">Select with organized option groups.</p>

        <NCard className="p-4">
          <h3 className="font-medium mb-4 flex items-center space-x-2">
            <Briefcase className="w-4 h-4" />
            <span>Technology Stack</span>
          </h3>
          <NSelect
            isMulti={true}
            label="Select Technologies"
            placeholder="Choose your tech stack..."
            isClearable={true}
            isSearchable={true}
            value={[]}
            options={groupedOptions as any}
            onChangeOptions={(values: { value: string; label: string }[]) => {
              handleSelectionChange('Tech Stack', values);
            }}
          />
          <p className="text-sm text-muted-foreground mt-2">Options are grouped by category for better organization</p>
        </NCard>
      </div>

      {/* Profile Form Example */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Profile Form Example</h2>
        <p className="text-muted-foreground mb-4">Multiple select components in a form context.</p>

        <NCard className="p-6">
          <h3 className="font-medium mb-6">Complete Your Profile</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <NSelect
                label="Country"
                placeholder="Select your country..."
                isClearable={true}
                isSearchable={true}
                value={profileData.country}
                options={countryOptions}
                onChangeOptions={(value: { value: string; label: string } | null) => {
                  setProfileData(prev => ({ ...prev, country: value }));
                  handleSelectionChange('Profile Country', value);
                }}
              />
            </div>

            <div>
              <NSelect
                label="Experience Level"
                placeholder="Select experience level..."
                isClearable={true}
                value={profileData.experience}
                options={experienceOptions}
                onChangeOptions={(value: { value: string; label: string } | null) => {
                  setProfileData(prev => ({ ...prev, experience: value }));
                  handleSelectionChange('Profile Experience', value);
                }}
              />
            </div>

            <div>
              <NSelect
                isMulti={true}
                label="Technical Skills"
                placeholder="Select your skills..."
                isClearable={true}
                isSearchable={true}
                value={profileData.skills}
                options={skillsOptions}
                onChangeOptions={(values: { value: string; label: string }[]) => {
                  setProfileData(prev => ({ ...prev, skills: values }));
                  handleSelectionChange('Profile Skills', values);
                }}
              />
            </div>

            <div>
              <NSelect
                isMulti={true}
                label="Interests"
                placeholder="Select your interests..."
                isClearable={true}
                isSearchable={true}
                value={profileData.interests}
                options={interestOptions}
                onChangeOptions={(values: { value: string; label: string }[]) => {
                  setProfileData(prev => ({ ...prev, interests: values }));
                  handleSelectionChange('Profile Interests', values);
                }}
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium mb-3">Profile Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Country:</span>
                <span className="ml-2 font-medium">{profileData.country?.label || 'Not selected'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Experience:</span>
                <span className="ml-2 font-medium">{profileData.experience?.label || 'Not selected'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Skills:</span>
                <span className="ml-2 font-medium">{profileData.skills.length > 0 ? `${profileData.skills.length} selected` : 'None'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Interests:</span>
                <span className="ml-2 font-medium">{profileData.interests.length > 0 ? `${profileData.interests.length} selected` : 'None'}</span>
              </div>
            </div>
          </div>
        </NCard>
      </div>

      {/* Custom Styled Selects */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Custom Styled Selects</h2>
        <p className="text-muted-foreground mb-4">Select components with custom styling and themes.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NCard className="p-4 border-blue-200 bg-card">
            <h3 className="font-medium mb-4 text-blue-800 dark:text-blue-200">Project Priority</h3>
            <NSelect
              label="Set Priority Level"
              placeholder="Choose priority..."
              isClearable={true}
              value={prioritySelect}
              options={priorityOptions}
              onChangeOptions={(value: { value: string; label: string } | null) => {
                setPrioritySelect(value);
                handleSelectionChange('Priority', value);
              }}
            />
          </NCard>

          <NCard className="p-4 border-green-200 bg-green-50 dark:bg-green-900/20">
            <h3 className="font-medium mb-4 text-green-800 dark:text-green-200">Department</h3>
            <NSelect
              label="Select Department"
              placeholder="Choose department..."
              isClearable={true}
              isSearchable={true}
              value={departmentSelect}
              options={departmentOptions}
              onChangeOptions={(value: { value: string; label: string } | null) => {
                setDepartmentSelect(value);
                handleSelectionChange('Department', value);
              }}
            />
          </NCard>
        </div>
      </div>

      {/* Select Best Practices */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Select Best Practices</h2>
        <p className="text-muted-foreground mb-4">Guidelines for effective select component implementation.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NCard className="p-4 border-green-200 bg-green-50 dark:bg-green-900/20">
            <h3 className="font-medium text-green-800 dark:text-green-200 mb-3">✅ Do</h3>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-2">
              <li>• Use clear, descriptive labels</li>
              <li>• Enable search for long option lists</li>
              <li>• Group related options together</li>
              <li>• Provide helpful placeholder text</li>
              <li>• Use multi-select for multiple choices</li>
              <li>• Enable clearing when appropriate</li>
              <li>• Show loading states for async data</li>
            </ul>
          </NCard>

          <NCard className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
            <h3 className="font-medium text-red-800 dark:text-red-200 mb-3">❌ Don't</h3>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-2">
              <li>• Use for binary choices (use radio/toggle)</li>
              <li>• Create overly long option lists</li>
              <li>• Use vague or technical labels</li>
              <li>• Forget to handle empty states</li>
              <li>• Disable without explanation</li>
              <li>• Mix different data types in options</li>
              <li>• Ignore keyboard navigation</li>
            </ul>
          </NCard>
        </div>
      </div>

      {/* Selection Summary */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Selection Summary</h2>
        <p className="text-muted-foreground mb-4">Track all select interactions and current selections.</p>

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
            <h3 className="font-medium mb-3">Current State Overview</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Single Select:</span>
                <span className="font-medium">{singleSelect?.label || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Multi Select:</span>
                <span className="font-medium">{multiSelect.length} items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tags:</span>
                <span className="font-medium">{tagsSelect.length} tags</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Skills:</span>
                <span className="font-medium">{skillsSelect.length} skills</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profile Complete:</span>
                <span className="font-medium">
                  {[profileData.country, profileData.experience].filter(Boolean).length + profileData.skills.length + profileData.interests.length}/4
                  fields
                </span>
              </div>
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground">Total interactions: {selectionHistory.length}</div>
              </div>
            </div>
          </NCard>
        </div>
      </div>

      {/* Technical Note */}
      <div className="mb-8">
        <NCard className="p-4 border-blue-200 bg-card">
          <div className="flex items-start space-x-3">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Technical Note</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                This component is built on top of the react-select library. For advanced customizations like custom option rendering, async loading,
                or complex styling, you can directly use react-select with additional props and configurations.
              </p>
            </div>
          </div>
        </NCard>
      </div>
    </ComponentWrapper>
  );
};

export default Select;
