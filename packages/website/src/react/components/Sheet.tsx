import { useState } from 'react';
import { NButton, NCard, NCheck, NInput, NSelect, NSheet, SheetSize } from '@nayan-ui/react';
import {
  Bell,
  Bookmark,
  Calendar,
  Check,
  Clock,
  CreditCard,
  Download,
  Edit,
  Filter,
  Heart,
  Image,
  Mail,
  MapPin,
  Menu,
  Phone,
  Plus,
  Search,
  Settings,
  Share2,
  Shield,
  Star,
  Tag,
  Trash2,
  Upload,
  User,
  X
} from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Sheet = () => {
  // Basic sheet states
  const [basicSheet, setBasicSheet] = useState(false);
  const [smallSheet, setSmallSheet] = useState(false);
  const [mediumSheet, setMediumSheet] = useState(false);
  const [largeSheet, setLargeSheet] = useState(false);
  const [fullSheet, setFullSheet] = useState(false);

  // Advanced sheet states
  const [settingsSheet, setSettingsSheet] = useState(false);
  const [profileSheet, setProfileSheet] = useState(false);
  const [actionSheet, setActionSheet] = useState(false);
  const [formSheet, setFormSheet] = useState(false);
  const [confirmSheet, setConfirmSheet] = useState(false);

  // Form data
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    bio: 'Software developer passionate about creating great user experiences.'
  });

  const [settingsData, setSettingsData] = useState({
    notifications: true,
    darkMode: false,
    autoSave: true,
    language: 'en'
  });

  const [sheetHistory, setSheetHistory] = useState<string[]>([]);

  const handleSheetAction = (action: string) => {
    setSheetHistory(prev => [...prev, `${action} - ${new Date().toLocaleTimeString()}`]);
  };

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'ja', label: 'Japanese' }
  ];

  return (
    <ComponentWrapper>
      {/* Basic Sheet Examples */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Basic Sheet Examples</h2>
        <p className="text-muted-foreground mb-4">Simple sheet components with different content types.</p>

        <div className="flex flex-wrap gap-3">
          <NButton
            onClick={() => {
              setBasicSheet(true);
              handleSheetAction('Opened Basic Sheet');
            }}>
            Basic Sheet
          </NButton>
        </div>

        <NSheet
          isOpen={basicSheet}
          size={SheetSize.MD}
          title="Basic Sheet"
          onCloseSheet={() => {
            setBasicSheet(false);
            handleSheetAction('Closed Basic Sheet');
          }}>
          <div className="p-4 space-y-4">
            <p className="text-muted-foreground">
              This is a basic sheet component. Sheets are slide-out panels that can contain any content and are perfect for forms, settings, or
              additional information without leaving the current page.
            </p>

            <div className="bg-card p-4 rounded-lg">
              <h4 className="font-medium mb-2">Sheet Features:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Slides in from the right side</li>
                <li>• Overlay background with click-to-close</li>
                <li>• Customizable sizes and titles</li>
                <li>• Keyboard navigation support</li>
                <li>• Smooth animations</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <NButton
                isOutline
                onClick={() => {
                  setBasicSheet(false);
                  handleSheetAction('Cancelled Basic Sheet');
                }}>
                Cancel
              </NButton>
              <NButton
                onClick={() => {
                  setBasicSheet(false);
                  handleSheetAction('Confirmed Basic Sheet');
                }}>
                Got it
              </NButton>
            </div>
          </div>
        </NSheet>
      </div>

      {/* Sheet Sizes */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Sheet Sizes</h2>
        <p className="text-muted-foreground mb-4">Different sheet sizes for various content needs.</p>

        <div className="flex flex-wrap gap-3">
          <NButton
            onClick={() => {
              setSmallSheet(true);
              handleSheetAction('Opened Small Sheet');
            }}>
            Small Sheet
          </NButton>
          <NButton
            onClick={() => {
              setMediumSheet(true);
              handleSheetAction('Opened Medium Sheet');
            }}>
            Medium Sheet
          </NButton>
          <NButton
            onClick={() => {
              setLargeSheet(true);
              handleSheetAction('Opened Large Sheet');
            }}>
            Large Sheet
          </NButton>
          <NButton
            onClick={() => {
              setFullSheet(true);
              handleSheetAction('Opened Full Sheet');
            }}>
            Full Width Sheet
          </NButton>
        </div>

        {/* Small Sheet */}
        <NSheet
          isOpen={smallSheet}
          size={SheetSize.SM}
          title="Small Sheet"
          onCloseSheet={() => {
            setSmallSheet(false);
            handleSheetAction('Closed Small Sheet');
          }}>
          <div className="p-4">
            <p className="text-muted-foreground mb-4">Small sheets are perfect for quick actions, notifications, or simple forms.</p>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Task completed successfully</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Processing time: 2.3 seconds</span>
              </div>
            </div>
          </div>
        </NSheet>

        {/* Medium Sheet */}
        <NSheet
          isOpen={mediumSheet}
          size={SheetSize.MD}
          title="Medium Sheet"
          onCloseSheet={() => {
            setMediumSheet(false);
            handleSheetAction('Closed Medium Sheet');
          }}>
          <div className="p-4 space-y-4">
            <p className="text-muted-foreground">Medium sheets provide more space for detailed content, forms, or lists.</p>

            <div className="grid grid-cols-2 gap-4">
              <NCard className="p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Download className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Downloads</span>
                </div>
                <p className="text-2xl font-bold">1,234</p>
                <p className="text-sm text-muted-foreground">This month</p>
              </NCard>

              <NCard className="p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Upload className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Uploads</span>
                </div>
                <p className="text-2xl font-bold">567</p>
                <p className="text-sm text-muted-foreground">This month</p>
              </NCard>
            </div>
          </div>
        </NSheet>

        {/* Large Sheet */}
        <NSheet
          isOpen={largeSheet}
          size={SheetSize.LG}
          title="Large Sheet"
          onCloseSheet={() => {
            setLargeSheet(false);
            handleSheetAction('Closed Large Sheet');
          }}>
          <div className="p-4 space-y-6">
            <p className="text-muted-foreground">Large sheets are ideal for complex forms, detailed views, or multi-step processes.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(item => (
                <NCard key={item} className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">Item {item}</h4>
                      <p className="text-sm text-muted-foreground">Description for item {item}</p>
                    </div>
                  </div>
                </NCard>
              ))}
            </div>
          </div>
        </NSheet>

        {/* Full Sheet */}
        <NSheet
          isOpen={fullSheet}
          size={SheetSize.FULL}
          title="Full Width Sheet"
          onCloseSheet={() => {
            setFullSheet(false);
            handleSheetAction('Closed Full Sheet');
          }}>
          <div className="p-4 space-y-6">
            <p className="text-muted-foreground">
              Full width sheets take up the entire viewport width, perfect for complex dashboards or detailed editing interfaces.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }, (_, i) => (
                <NCard key={i} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Section {i + 1}</h4>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <p className="text-sm text-muted-foreground">This is a content section with various information and controls.</p>
                    <div className="flex space-x-2">
                      <NButton size="sm" isOutline>
                        Edit
                      </NButton>
                      <NButton size="sm" isOutline>
                        View
                      </NButton>
                    </div>
                  </div>
                </NCard>
              ))}
            </div>
          </div>
        </NSheet>
      </div>

      {/* Settings Sheet */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Settings Sheet</h2>
        <p className="text-muted-foreground mb-4">Sheet with form controls for application settings.</p>

        <NButton
          onClick={() => {
            setSettingsSheet(true);
            handleSheetAction('Opened Settings Sheet');
          }}>
          <Settings className="w-4 h-4 mr-2" />
          Open Settings
        </NButton>

        <NSheet
          isOpen={settingsSheet}
          size={SheetSize.MD}
          title="Application Settings"
          onCloseSheet={() => {
            setSettingsSheet(false);
            handleSheetAction('Closed Settings Sheet');
          }}>
          <div className="p-4 space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </h3>

              <div className="space-y-3 pl-6">
                <NCheck
                  checked={settingsData.notifications}
                  onChange={checked => {
                    setSettingsData(prev => ({ ...prev, notifications: checked }));
                    handleSheetAction(`${checked ? 'Enabled' : 'Disabled'} Notifications`);
                  }}
                  label="Enable push notifications"
                />

                <NCheck
                  checked={settingsData.autoSave}
                  onChange={checked => {
                    setSettingsData(prev => ({ ...prev, autoSave: checked }));
                    handleSheetAction(`${checked ? 'Enabled' : 'Disabled'} Auto Save`);
                  }}
                  label="Auto-save changes"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Preferences</span>
              </h3>

              <div className="space-y-3 pl-6">
                <NCheck
                  checked={settingsData.darkMode}
                  onChange={checked => {
                    setSettingsData(prev => ({ ...prev, darkMode: checked }));
                    handleSheetAction(`${checked ? 'Enabled' : 'Disabled'} Dark Mode`);
                  }}
                  label="Dark mode"
                />

                <div>
                  <label className="block text-sm font-medium mb-2">Language</label>
                  <NSelect
                    value={languageOptions.find(opt => opt.value === settingsData.language)}
                    options={languageOptions}
                    onChangeOptions={option => {
                      setSettingsData(prev => ({ ...prev, language: option.value }));
                      handleSheetAction(`Changed Language to ${option.label}`);
                    }}
                    placeholder="Select language..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <NButton
                isOutline
                onClick={() => {
                  setSettingsSheet(false);
                  handleSheetAction('Cancelled Settings');
                }}>
                Cancel
              </NButton>
              <NButton
                onClick={() => {
                  setSettingsSheet(false);
                  handleSheetAction('Saved Settings');
                }}>
                Save Changes
              </NButton>
            </div>
          </div>
        </NSheet>
      </div>

      {/* Profile Sheet */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Profile Sheet</h2>
        <p className="text-muted-foreground mb-4">Sheet for editing user profile information.</p>

        <NButton
          onClick={() => {
            setProfileSheet(true);
            handleSheetAction('Opened Profile Sheet');
          }}>
          <User className="w-4 h-4 mr-2" />
          Edit Profile
        </NButton>

        <NSheet
          isOpen={profileSheet}
          size={SheetSize.LG}
          title="Edit Profile"
          onCloseSheet={() => {
            setProfileSheet(false);
            handleSheetAction('Closed Profile Sheet');
          }}>
          <div className="p-4 space-y-6">
            <div className="flex items-center space-x-4 pb-4 border-b">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-medium">{profileData.name}</h3>
                <p className="text-sm text-muted-foreground">{profileData.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <NInput
                  value={profileData.name}
                  onChange={e => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <NInput
                  type="email"
                  value={profileData.email}
                  onChange={e => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <NInput
                  value={profileData.phone}
                  onChange={e => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                  rows={3}
                  value={profileData.bio}
                  onChange={e => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <NButton
                isOutline
                onClick={() => {
                  setProfileSheet(false);
                  handleSheetAction('Cancelled Profile Edit');
                }}>
                Cancel
              </NButton>
              <NButton
                onClick={() => {
                  setProfileSheet(false);
                  handleSheetAction('Saved Profile Changes');
                }}>
                Save Profile
              </NButton>
            </div>
          </div>
        </NSheet>
      </div>

      {/* Action Sheet */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Action Sheet</h2>
        <p className="text-muted-foreground mb-4">Sheet with action buttons for quick operations.</p>

        <NButton
          onClick={() => {
            setActionSheet(true);
            handleSheetAction('Opened Action Sheet');
          }}>
          <Menu className="w-4 h-4 mr-2" />
          Show Actions
        </NButton>

        <NSheet
          isOpen={actionSheet}
          size={SheetSize.SM}
          title="Quick Actions"
          onCloseSheet={() => {
            setActionSheet(false);
            handleSheetAction('Closed Action Sheet');
          }}>
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <button
                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                onClick={() => {
                  handleSheetAction('Downloaded File');
                  setActionSheet(false);
                }}>
                <Download className="w-4 h-4 text-blue-500" />
                <span>Download</span>
              </button>

              <button
                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                onClick={() => {
                  handleSheetAction('Shared Item');
                  setActionSheet(false);
                }}>
                <Share2 className="w-4 h-4 text-green-500" />
                <span>Share</span>
              </button>

              <button
                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                onClick={() => {
                  handleSheetAction('Edited Item');
                  setActionSheet(false);
                }}>
                <Edit className="w-4 h-4 text-orange-500" />
                <span>Edit</span>
              </button>

              <button
                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                onClick={() => {
                  setActionSheet(false);
                  setConfirmSheet(true);
                  handleSheetAction('Requested Delete');
                }}>
                <Trash2 className="w-4 h-4 text-red-500" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </NSheet>

        {/* Confirmation Sheet */}
        <NSheet
          isOpen={confirmSheet}
          size={SheetSize.SM}
          title="Confirm Delete"
          onCloseSheet={() => {
            setConfirmSheet(false);
            handleSheetAction('Cancelled Delete');
          }}>
          <div className="p-4 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-medium">Delete Item</h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this item? All associated data will be permanently removed.
            </p>

            <div className="flex justify-end space-x-2 pt-4">
              <NButton
                isOutline
                onClick={() => {
                  setConfirmSheet(false);
                  handleSheetAction('Cancelled Delete');
                }}>
                Cancel
              </NButton>
              <NButton
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  setConfirmSheet(false);
                  handleSheetAction('Confirmed Delete');
                }}>
                Delete
              </NButton>
            </div>
          </div>
        </NSheet>
      </div>

      {/* Sheet Best Practices */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Sheet Best Practices</h2>
        <p className="text-muted-foreground mb-4">Guidelines for effective sheet implementation.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NCard className="p-4 border-green-200 bg-green-50 dark:bg-green-900/20">
            <h3 className="font-medium text-green-800 dark:text-green-200 mb-3">✅ Do</h3>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-2">
              <li>• Use appropriate sizes for content</li>
              <li>• Provide clear titles and actions</li>
              <li>• Include cancel/close options</li>
              <li>• Use for forms and detailed views</li>
              <li>• Implement proper keyboard navigation</li>
              <li>• Show loading states when needed</li>
              <li>• Group related actions together</li>
            </ul>
          </NCard>

          <NCard className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
            <h3 className="font-medium text-red-800 dark:text-red-200 mb-3">❌ Don't</h3>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-2">
              <li>• Use for simple confirmations (use dialogs)</li>
              <li>• Make sheets too narrow for content</li>
              <li>• Forget to handle escape key</li>
              <li>• Stack multiple sheets</li>
              <li>• Use for critical system alerts</li>
              <li>• Ignore mobile responsiveness</li>
              <li>• Hide important actions</li>
            </ul>
          </NCard>
        </div>
      </div>

      {/* Sheet Activity Summary */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Sheet Activity Summary</h2>
        <p className="text-muted-foreground mb-4">Track all sheet interactions and actions.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NCard className="p-4">
            <h3 className="font-medium mb-3">Recent Sheet Actions</h3>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {sheetHistory.length > 0 ? (
                sheetHistory
                  .slice(-10)
                  .reverse()
                  .map((action, index) => (
                    <div key={index} className="text-sm p-2 bg-card rounded">
                      {action}
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No sheet actions yet. Try opening some sheets above.</p>
              )}
            </div>
          </NCard>

          <NCard className="p-4">
            <h3 className="font-medium mb-3">Current Sheet States</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Basic Sheet:</span>
                <span className={`font-medium ${basicSheet ? 'text-green-600' : 'text-gray-500'}`}>{basicSheet ? 'Open' : 'Closed'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Settings Sheet:</span>
                <span className={`font-medium ${settingsSheet ? 'text-green-600' : 'text-gray-500'}`}>{settingsSheet ? 'Open' : 'Closed'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profile Sheet:</span>
                <span className={`font-medium ${profileSheet ? 'text-green-600' : 'text-gray-500'}`}>{profileSheet ? 'Open' : 'Closed'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Action Sheet:</span>
                <span className={`font-medium ${actionSheet ? 'text-green-600' : 'text-gray-500'}`}>{actionSheet ? 'Open' : 'Closed'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confirm Sheet:</span>
                <span className={`font-medium ${confirmSheet ? 'text-green-600' : 'text-gray-500'}`}>{confirmSheet ? 'Open' : 'Closed'}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground">Total actions: {sheetHistory.length}</div>
              </div>
            </div>
          </NCard>
        </div>
      </div>
    </ComponentWrapper>
  );
};

export default Sheet;
