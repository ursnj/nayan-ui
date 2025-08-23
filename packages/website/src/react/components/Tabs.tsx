import { useState } from 'react';
import { NBadge, NTabs, NTabsContent } from '@nayan-ui/react';
import {
  Activity,
  BarChart3,
  Bell,
  Bookmark,
  Calendar,
  Clock,
  CreditCard,
  Database,
  FileText,
  Globe,
  Heart,
  Home,
  Mail,
  MessageSquare,
  Monitor,
  RotateCcw,
  Settings,
  Shield,
  Smartphone,
  Tablet,
  TrendingUp,
  User,
  Users
} from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Tabs = () => {
  // Basic tabs
  const basicItems = ['POSTS', 'SAVED'];
  const [basicSelected, setBasicSelected] = useState(basicItems[0]);

  // Tabs with icons
  const iconItems = [
    { label: 'Dashboard', icon: Home },
    { label: 'Profile', icon: User },
    { label: 'Settings', icon: Settings }
  ];
  const [iconSelected, setIconSelected] = useState(iconItems[0].label);

  // Navigation tabs
  const navItems = ['Overview', 'Analytics', 'Reports', 'Settings'];
  const [navSelected, setNavSelected] = useState(navItems[0]);

  // Settings tabs
  const settingsItems = ['General', 'Security', 'Notifications', 'Billing'];
  const [settingsSelected, setSettingsSelected] = useState(settingsItems[0]);

  // Dashboard tabs
  const dashboardItems = ['Stats', 'Users', 'Orders', 'Revenue'];
  const [dashboardSelected, setDashboardSelected] = useState(dashboardItems[0]);

  // Content management tabs
  const contentItems = ['Articles', 'Comments', 'Media', 'Categories'];
  const [contentSelected, setContentSelected] = useState(contentItems[0]);

  // Device tabs
  const deviceItems = ['Mobile', 'Tablet', 'Desktop'];
  const [deviceSelected, setDeviceSelected] = useState(deviceItems[0]);

  // Tab interaction tracking
  const [tabHistory, setTabHistory] = useState<
    Array<{
      tab: string;
      section: string;
      timestamp: string;
    }>
  >([]);

  const handleTabChange = (tab: string, section: string, setter: (value: string) => void) => {
    setter(tab);
    setTabHistory(prev => [
      {
        tab,
        section,
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev.slice(0, 9) // Keep last 10 changes
    ]);
  };

  const resetTabHistory = () => {
    setTabHistory([]);
  };

  return (
    <ComponentWrapper>
      <div className="space-y-8">
        {/* Basic Tabs */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Basic Tabs</h3>
          <p className="text-gray-600 mb-4">Simple tabs for organizing content into different sections with clean navigation.</p>
          <NTabs items={basicItems} selected={basicSelected} onChange={tab => handleTabChange(tab, 'Basic Tabs', setBasicSelected)}>
            <NTabsContent item={basicItems[0]} className="px-4 py-6 text-gray-700">
              <div className="space-y-4">
                <h4 className="font-medium">Recent Posts</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h5 className="font-medium">Getting Started with React</h5>
                    <p className="text-sm text-gray-600 mt-1">Learn the basics of React development...</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>2 hours ago</span>
                      <span>•</span>
                      <span>5 min read</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h5 className="font-medium">Advanced TypeScript Tips</h5>
                    <p className="text-sm text-gray-600 mt-1">Improve your TypeScript skills with these tips...</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>1 day ago</span>
                      <span>•</span>
                      <span>8 min read</span>
                    </div>
                  </div>
                </div>
              </div>
            </NTabsContent>
            <NTabsContent item={basicItems[1]} className="px-4 py-6 text-gray-700">
              <div className="space-y-4">
                <h4 className="font-medium">Saved Articles</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h5 className="font-medium">UI Design Principles</h5>
                    <p className="text-sm text-gray-600 mt-1">Essential principles for great UI design...</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>Saved 3 days ago</span>
                      <span>•</span>
                      <span>12 min read</span>
                    </div>
                  </div>
                </div>
              </div>
            </NTabsContent>
          </NTabs>
        </section>

        {/* Full Width Tabs */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Full Width Tabs</h3>
          <p className="text-gray-600 mb-4">Tabs that span the full width of their container for better visual balance.</p>
          <NTabs isFull={true} items={navItems} selected={navSelected} onChange={tab => handleTabChange(tab, 'Navigation Tabs', setNavSelected)}>
            <NTabsContent item={navItems[0]} className="px-4 py-6 text-gray-700">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium">Total Revenue</h4>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">$45,231</p>
                  <p className="text-sm text-gray-600">+20.1% from last month</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium">Active Users</h4>
                  </div>
                  <p className="text-2xl font-bold text-green-600">2,350</p>
                  <p className="text-sm text-gray-600">+180 new users</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    <h4 className="font-medium">Conversion Rate</h4>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">3.2%</p>
                  <p className="text-sm text-gray-600">+0.5% improvement</p>
                </div>
              </div>
            </NTabsContent>
            <NTabsContent item={navItems[1]} className="px-4 py-6 text-gray-700">
              <div className="space-y-4">
                <h4 className="font-medium">Analytics Dashboard</h4>
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Analytics charts and graphs would be displayed here</p>
                </div>
              </div>
            </NTabsContent>
            <NTabsContent item={navItems[2]} className="px-4 py-6 text-gray-700">
              <div className="space-y-4">
                <h4 className="font-medium">Reports</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <span>Monthly Sales Report</span>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Download</button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <span>User Activity Report</span>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Download</button>
                  </div>
                </div>
              </div>
            </NTabsContent>
            <NTabsContent item={navItems[3]} className="px-4 py-6 text-gray-700">
              <div className="space-y-4">
                <h4 className="font-medium">Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Email Notifications</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Auto-save Reports</span>
                    <input type="checkbox" className="rounded" />
                  </div>
                </div>
              </div>
            </NTabsContent>
          </NTabs>
        </section>

        {/* Settings Panel Tabs */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Settings Panel Tabs</h3>
          <p className="text-gray-600 mb-4">Comprehensive settings interface with multiple configuration sections.</p>
          <NTabs items={settingsItems} selected={settingsSelected} onChange={tab => handleTabChange(tab, 'Settings Panel', setSettingsSelected)}>
            <NTabsContent item={settingsItems[0]} className="px-4 py-6 text-gray-700">
              <div className="space-y-6">
                <h4 className="font-medium">General Settings</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Display Name</label>
                    <input
                      type="text"
                      defaultValue="John Doe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      defaultValue="john@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Language</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </div>
                </div>
              </div>
            </NTabsContent>
            <NTabsContent item={settingsItems[1]} className="px-4 py-6 text-gray-700">
              <div className="space-y-6">
                <h4 className="font-medium">Security Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-600">Add an extra layer of security</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Enable</button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Password</p>
                      <p className="text-sm text-gray-600">Last changed 3 months ago</p>
                    </div>
                    <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Change</button>
                  </div>
                </div>
              </div>
            </NTabsContent>
            <NTabsContent item={settingsItems[2]} className="px-4 py-6 text-gray-700">
              <div className="space-y-6">
                <h4 className="font-medium">Notification Preferences</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-600">Receive updates via email</p>
                      </div>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-gray-600">Get notified in your browser</p>
                      </div>
                    </div>
                    <input type="checkbox" className="rounded" />
                  </div>
                </div>
              </div>
            </NTabsContent>
            <NTabsContent item={settingsItems[3]} className="px-4 py-6 text-gray-700">
              <div className="space-y-6">
                <h4 className="font-medium">Billing Information</h4>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5 text-gray-600" />
                        <span className="font-medium">Current Plan</span>
                      </div>
                      <NBadge className="bg-green-100 text-green-800">Pro</NBadge>
                    </div>
                    <p className="text-sm text-gray-600">$29/month • Next billing: Feb 15, 2024</p>
                  </div>
                  <button className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Manage Subscription</button>
                </div>
              </div>
            </NTabsContent>
          </NTabs>
        </section>

        {/* Device Responsive Tabs */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Device Preview Tabs</h3>
          <p className="text-gray-600 mb-4">Preview content across different device types with responsive design considerations.</p>
          <NTabs items={deviceItems} selected={deviceSelected} onChange={tab => handleTabChange(tab, 'Device Preview', setDeviceSelected)}>
            <NTabsContent item={deviceItems[0]} className="px-4 py-6 text-gray-700">
              <div className="max-w-sm mx-auto bg-gray-100 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Mobile View</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <h5 className="font-medium text-sm">Mobile-Optimized Content</h5>
                    <p className="text-xs text-gray-600 mt-1">Content designed for mobile screens</p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <h5 className="font-medium text-sm">Touch-Friendly Interface</h5>
                    <p className="text-xs text-gray-600 mt-1">Larger buttons and touch targets</p>
                  </div>
                </div>
              </div>
            </NTabsContent>
            <NTabsContent item={deviceItems[1]} className="px-4 py-6 text-gray-700">
              <div className="max-w-md mx-auto bg-gray-100 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Tablet className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Tablet View</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <h5 className="font-medium text-sm">Tablet Layout</h5>
                    <p className="text-xs text-gray-600 mt-1">Optimized for tablet screens</p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <h5 className="font-medium text-sm">Medium Density</h5>
                    <p className="text-xs text-gray-600 mt-1">Balanced content density</p>
                  </div>
                </div>
              </div>
            </NTabsContent>
            <NTabsContent item={deviceItems[2]} className="px-4 py-6 text-gray-700">
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Monitor className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Desktop View</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded shadow-sm">
                    <h5 className="font-medium">Desktop Layout</h5>
                    <p className="text-sm text-gray-600 mt-2">Full-featured desktop interface with maximum content density</p>
                  </div>
                  <div className="bg-white p-4 rounded shadow-sm">
                    <h5 className="font-medium">Rich Interactions</h5>
                    <p className="text-sm text-gray-600 mt-2">Hover effects, keyboard shortcuts, and advanced features</p>
                  </div>
                  <div className="bg-white p-4 rounded shadow-sm">
                    <h5 className="font-medium">Multi-Column</h5>
                    <p className="text-sm text-gray-600 mt-2">Take advantage of larger screen real estate</p>
                  </div>
                </div>
              </div>
            </NTabsContent>
          </NTabs>
        </section>

        {/* Tabs Best Practices */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Tabs Best Practices</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">✅ Do's</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Use clear, descriptive tab labels</li>
                <li>• Keep tab content related and logical</li>
                <li>• Provide visual feedback for active tabs</li>
                <li>• Use consistent tab styling throughout</li>
                <li>• Consider keyboard navigation support</li>
                <li>• Group related functionality together</li>
                <li>• Use icons to enhance understanding</li>
                <li>• Make tabs accessible with proper ARIA labels</li>
              </ul>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">❌ Don'ts</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Don't use too many tabs (max 5-7)</li>
                <li>• Don't use tabs for sequential processes</li>
                <li>• Don't make tab labels too long</li>
                <li>• Don't nest tabs within tabs</li>
                <li>• Don't use tabs for single pieces of content</li>
                <li>• Don't forget to handle loading states</li>
                <li>• Don't ignore mobile responsiveness</li>
                <li>• Don't use tabs for navigation between pages</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Tab State Summary */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Tab State Summary</h3>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Current Tab States</h4>
              <button
                onClick={resetTabHistory}
                className="flex items-center space-x-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm transition-colors">
                <RotateCcw className="w-4 h-4" />
                <span>Clear History</span>
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <h5 className="font-medium mb-2">Active Tabs</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Basic Tabs:</span>
                    <span className="text-blue-600 font-medium">{basicSelected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Navigation:</span>
                    <span className="text-blue-600 font-medium">{navSelected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Settings:</span>
                    <span className="text-blue-600 font-medium">{settingsSelected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Device Preview:</span>
                    <span className="text-blue-600 font-medium">{deviceSelected}</span>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium mb-2">Tab Statistics</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Tab Sections:</span>
                    <span className="text-gray-600">4</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Tab Items:</span>
                    <span className="text-gray-600">15</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tab Changes:</span>
                    <span className="text-gray-600">{tabHistory.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {tabHistory.length > 0 && (
              <div>
                <h5 className="font-medium mb-2">Recent Tab Changes</h5>
                <div className="max-h-32 overflow-y-auto">
                  <div className="space-y-1">
                    {tabHistory.map((change, index) => (
                      <div key={index} className="flex justify-between items-center text-sm py-1 px-2 bg-white rounded">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="font-medium">{change.section}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-blue-600">{change.tab}</span>
                        </div>
                        <span className="text-gray-400 text-xs">{change.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </ComponentWrapper>
  );
};

export default Tabs;
