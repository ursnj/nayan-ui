import { useState } from 'react';
import { NButton, NTooltip } from '@nayan-ui/react';
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  Battery,
  Bell,
  BellOff,
  Brightness,
  Brush,
  Calendar,
  Camera,
  Check,
  Clock,
  Cloud,
  Code,
  Copy,
  Database,
  Download,
  Edit,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Folder,
  Globe,
  Headphones,
  Heart,
  HelpCircle,
  Image,
  Info,
  Layers,
  Link,
  Lock,
  Mail,
  MapPin,
  Mic,
  Minus,
  Monitor,
  MoreHorizontal,
  Move,
  Palette,
  Phone,
  PieChart,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Server,
  Settings,
  Share,
  Shield,
  Smartphone,
  Star,
  Target,
  Terminal,
  Trash2,
  TrendingUp,
  Unlock,
  Upload,
  User,
  Video,
  Volume2,
  Wifi,
  X,
  Zap
} from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Tooltip = () => {
  // Tooltip interaction tracking
  const [tooltipHistory, setTooltipHistory] = useState<
    Array<{
      element: string;
      message: string;
      timestamp: string;
    }>
  >([]);

  const logTooltipInteraction = (element: string, message: string) => {
    setTooltipHistory(prev => [
      {
        element,
        message,
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev.slice(0, 14) // Keep last 15 interactions
    ]);
  };

  const clearTooltipHistory = () => {
    setTooltipHistory([]);
  };

  return (
    <ComponentWrapper>
      <div className="space-y-8">
        {/* Basic Tooltip */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Basic Tooltip</h3>
          <p className="text-gray-600 mb-4">Simple tooltip that appears on hover to provide additional context and information.</p>
          <div className="flex items-center space-x-4">
            <NTooltip message="This is a basic tooltip with helpful information!">
              <NButton onMouseEnter={() => logTooltipInteraction('Basic Button', 'This is a basic tooltip with helpful information!')}>
                Hover for Tooltip
              </NButton>
            </NTooltip>
            <NTooltip message="Click this button to perform an action">
              <NButton
                className="flex items-center space-x-2"
                onMouseEnter={() => logTooltipInteraction('Action Button', 'Click this button to perform an action')}>
                <Info className="w-4 h-4" />
                <span>Info Button</span>
              </NButton>
            </NTooltip>
          </div>
        </section>

        {/* Icon Tooltips */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Icon Tooltips</h3>
          <p className="text-gray-600 mb-4">Tooltips for icon-only buttons to explain their functionality and purpose.</p>
          <div className="flex flex-wrap gap-3">
            <NTooltip message="Edit this item">
              <button
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                onMouseEnter={() => logTooltipInteraction('Edit Icon', 'Edit this item')}>
                <Edit className="w-5 h-5" />
              </button>
            </NTooltip>
            <NTooltip message="Delete permanently">
              <button
                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                onMouseEnter={() => logTooltipInteraction('Delete Icon', 'Delete permanently')}>
                <Trash2 className="w-5 h-5" />
              </button>
            </NTooltip>
            <NTooltip message="Copy to clipboard">
              <button
                className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                onMouseEnter={() => logTooltipInteraction('Copy Icon', 'Copy to clipboard')}>
                <Copy className="w-5 h-5" />
              </button>
            </NTooltip>
            <NTooltip message="Share with others">
              <button
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                onMouseEnter={() => logTooltipInteraction('Share Icon', 'Share with others')}>
                <Share className="w-5 h-5" />
              </button>
            </NTooltip>
            <NTooltip message="Download file">
              <button
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                onMouseEnter={() => logTooltipInteraction('Download Icon', 'Download file')}>
                <Download className="w-5 h-5" />
              </button>
            </NTooltip>
            <NTooltip message="Upload new file">
              <button
                className="p-2 text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
                onMouseEnter={() => logTooltipInteraction('Upload Icon', 'Upload new file')}>
                <Upload className="w-5 h-5" />
              </button>
            </NTooltip>
          </div>
        </section>

        {/* Form Field Tooltips */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Form Field Tooltips</h3>
          <p className="text-gray-600 mb-4">Helpful tooltips for form fields to guide users and provide input instructions.</p>
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <NTooltip message="Enter your valid email address for account verification">
                <HelpCircle
                  className="w-4 h-4 text-gray-400 cursor-help"
                  onMouseEnter={() => logTooltipInteraction('Email Help', 'Enter your valid email address for account verification')}
                />
              </NTooltip>
            </div>
            <input
              type="email"
              placeholder="john@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex items-center space-x-2">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <NTooltip message="Password must be at least 8 characters with uppercase, lowercase, and numbers">
                <HelpCircle
                  className="w-4 h-4 text-gray-400 cursor-help"
                  onMouseEnter={() =>
                    logTooltipInteraction('Password Help', 'Password must be at least 8 characters with uppercase, lowercase, and numbers')
                  }
                />
              </NTooltip>
            </div>
            <input
              type="password"
              placeholder="Enter secure password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </section>

        {/* Status Indicator Tooltips */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Status Indicator Tooltips</h3>
          <p className="text-gray-600 mb-4">Status indicators with tooltips to explain current states and conditions.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <NTooltip message="System is online and functioning normally">
                  <div
                    className="w-3 h-3 bg-green-500 rounded-full cursor-help"
                    onMouseEnter={() => logTooltipInteraction('Online Status', 'System is online and functioning normally')}
                  />
                </NTooltip>
                <span className="text-sm font-medium">Online</span>
              </div>
              <p className="text-xs text-gray-500">All systems operational</p>
            </div>

            <div className="bg-white p-4 rounded-lg border text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <NTooltip message="System is temporarily unavailable for maintenance">
                  <div
                    className="w-3 h-3 bg-yellow-500 rounded-full cursor-help"
                    onMouseEnter={() => logTooltipInteraction('Maintenance Status', 'System is temporarily unavailable for maintenance')}
                  />
                </NTooltip>
                <span className="text-sm font-medium">Maintenance</span>
              </div>
              <p className="text-xs text-gray-500">Scheduled downtime</p>
            </div>

            <div className="bg-white p-4 rounded-lg border text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <NTooltip message="System is experiencing issues and may be slow">
                  <div
                    className="w-3 h-3 bg-red-500 rounded-full cursor-help"
                    onMouseEnter={() => logTooltipInteraction('Error Status', 'System is experiencing issues and may be slow')}
                  />
                </NTooltip>
                <span className="text-sm font-medium">Error</span>
              </div>
              <p className="text-xs text-gray-500">Service disruption</p>
            </div>

            <div className="bg-white p-4 rounded-lg border text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <NTooltip message="System status is unknown or being checked">
                  <div
                    className="w-3 h-3 bg-gray-500 rounded-full cursor-help"
                    onMouseEnter={() => logTooltipInteraction('Unknown Status', 'System status is unknown or being checked')}
                  />
                </NTooltip>
                <span className="text-sm font-medium">Unknown</span>
              </div>
              <p className="text-xs text-gray-500">Status checking</p>
            </div>
          </div>
        </section>

        {/* Navigation Tooltips */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Navigation Tooltips</h3>
          <p className="text-gray-600 mb-4">Navigation elements with tooltips to explain destinations and functionality.</p>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <NTooltip message="Go to dashboard overview">
                <button
                  className="p-2 text-white hover:bg-gray-700 rounded-md transition-colors"
                  onMouseEnter={() => logTooltipInteraction('Dashboard Nav', 'Go to dashboard overview')}>
                  <BarChart3 className="w-5 h-5" />
                </button>
              </NTooltip>
              <NTooltip message="Manage user accounts and permissions">
                <button
                  className="p-2 text-white hover:bg-gray-700 rounded-md transition-colors"
                  onMouseEnter={() => logTooltipInteraction('Users Nav', 'Manage user accounts and permissions')}>
                  <User className="w-5 h-5" />
                </button>
              </NTooltip>
              <NTooltip message="Configure application settings">
                <button
                  className="p-2 text-white hover:bg-gray-700 rounded-md transition-colors"
                  onMouseEnter={() => logTooltipInteraction('Settings Nav', 'Configure application settings')}>
                  <Settings className="w-5 h-5" />
                </button>
              </NTooltip>
              <NTooltip message="View notifications and alerts">
                <button
                  className="p-2 text-white hover:bg-gray-700 rounded-md transition-colors relative"
                  onMouseEnter={() => logTooltipInteraction('Notifications Nav', 'View notifications and alerts')}>
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </button>
              </NTooltip>
              <NTooltip message="Access help documentation">
                <button
                  className="p-2 text-white hover:bg-gray-700 rounded-md transition-colors"
                  onMouseEnter={() => logTooltipInteraction('Help Nav', 'Access help documentation')}>
                  <HelpCircle className="w-5 h-5" />
                </button>
              </NTooltip>
            </div>
          </div>
        </section>

        {/* Data Visualization Tooltips */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Data Visualization Tooltips</h3>
          <p className="text-gray-600 mb-4">Interactive data points with detailed tooltips showing metrics and insights.</p>
          <div className="bg-white rounded-lg border p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <NTooltip message="Total Revenue: $45,231 (+20.1% from last month)">
                <div
                  className="bg-blue-50 p-4 rounded-lg cursor-help hover:bg-blue-100 transition-colors"
                  onMouseEnter={() => logTooltipInteraction('Revenue Metric', 'Total Revenue: $45,231 (+20.1% from last month)')}>
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Revenue</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">$45,231</p>
                </div>
              </NTooltip>

              <NTooltip message="Active Users: 2,350 (180 new users this month)">
                <div
                  className="bg-green-50 p-4 rounded-lg cursor-help hover:bg-green-100 transition-colors"
                  onMouseEnter={() => logTooltipInteraction('Users Metric', 'Active Users: 2,350 (180 new users this month)')}>
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Users</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">2,350</p>
                </div>
              </NTooltip>

              <NTooltip message="Conversion Rate: 3.2% (+0.5% improvement this quarter)">
                <div
                  className="bg-purple-50 p-4 rounded-lg cursor-help hover:bg-purple-100 transition-colors"
                  onMouseEnter={() => logTooltipInteraction('Conversion Metric', 'Conversion Rate: 3.2% (+0.5% improvement this quarter)')}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Conversion</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">3.2%</p>
                </div>
              </NTooltip>

              <NTooltip message="Customer Satisfaction: 4.8/5 (Based on 1,247 reviews)">
                <div
                  className="bg-yellow-50 p-4 rounded-lg cursor-help hover:bg-yellow-100 transition-colors"
                  onMouseEnter={() => logTooltipInteraction('Satisfaction Metric', 'Customer Satisfaction: 4.8/5 (Based on 1,247 reviews)')}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium">Satisfaction</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">4.8/5</p>
                </div>
              </NTooltip>
            </div>
          </div>
        </section>

        {/* Tooltip Best Practices */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Tooltip Best Practices</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">✅ Do's</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Keep tooltip text concise and helpful</li>
                <li>• Use tooltips for icons and unclear elements</li>
                <li>• Provide additional context, not obvious information</li>
                <li>• Position tooltips to avoid blocking content</li>
                <li>• Use consistent timing for show/hide</li>
                <li>• Make tooltips accessible with keyboard navigation</li>
                <li>• Use appropriate contrast for readability</li>
                <li>• Include helpful instructions for form fields</li>
              </ul>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">❌ Don'ts</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Don't use tooltips for critical information</li>
                <li>• Don't make tooltip text too long</li>
                <li>• Don't use tooltips on mobile (use alternative)</li>
                <li>• Don't repeat obvious button text</li>
                <li>• Don't use tooltips for complex interactions</li>
                <li>• Don't forget keyboard accessibility</li>
                <li>• Don't use tooltips for error messages</li>
                <li>• Don't make tooltips appear too quickly</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Tooltip Interaction Summary */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Tooltip Interaction Summary</h3>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Recent Tooltip Interactions</h4>
              <button
                onClick={clearTooltipHistory}
                className="flex items-center space-x-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm transition-colors">
                <RefreshCw className="w-4 h-4" />
                <span>Clear History</span>
              </button>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{tooltipHistory.length}</div>
                  <div className="text-sm text-gray-600">Total Interactions</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{new Set(tooltipHistory.map(t => t.element)).size}</div>
                  <div className="text-sm text-gray-600">Unique Elements</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {tooltipHistory.length > 0 ? Math.round(tooltipHistory.reduce((acc, t) => acc + t.message.length, 0) / tooltipHistory.length) : 0}
                  </div>
                  <div className="text-sm text-gray-600">Avg. Message Length</div>
                </div>
              </div>
            </div>

            {tooltipHistory.length > 0 ? (
              <div>
                <h5 className="font-medium mb-2">Tooltip Interaction History</h5>
                <div className="max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {tooltipHistory.map((interaction, index) => (
                      <div key={index} className="flex justify-between items-start text-sm py-2 px-3 bg-white rounded border">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Info className="w-3 h-3 text-gray-400" />
                            <span className="font-medium">{interaction.element}</span>
                          </div>
                          <p className="text-gray-600 mt-1 text-xs">{interaction.message}</p>
                        </div>
                        <span className="text-gray-400 text-xs ml-2">{interaction.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No tooltip interactions yet. Hover over elements above to see tooltips!</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </ComponentWrapper>
  );
};

export default Tooltip;
