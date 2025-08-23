import { useEffect, useState } from 'react';
import { NButton, NCard, NSkeleton } from '@nayan-ui/react';
import {
  Battery,
  Calendar,
  Clock,
  CreditCard,
  FileText,
  Heart,
  Image,
  MapPin,
  MessageCircle,
  Play,
  Settings,
  Share2,
  ShoppingCart,
  Signal,
  Star,
  User,
  Video,
  Wifi
} from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Skeleton = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [cardLoading, setCardLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Simulate loading states
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const simulateLoading = (setter: (value: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const resetAllLoading = () => {
    setIsLoading(true);
    setCardLoading(true);
    setListLoading(true);
    setTableLoading(true);
    setDashboardLoading(true);

    setTimeout(() => setIsLoading(false), 3000);
    setTimeout(() => setCardLoading(false), 2500);
    setTimeout(() => setListLoading(false), 2000);
    setTimeout(() => setTableLoading(false), 3500);
    setTimeout(() => setDashboardLoading(false), 4000);
  };

  return (
    <ComponentWrapper>
      {/* Basic Skeleton Examples */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Basic Skeleton Examples</h2>
        <p className="text-muted-foreground mb-4">Simple skeleton components for different content types.</p>

        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-3">Text Lines</h3>
            <div className="space-y-2">
              <NSkeleton className="h-4 w-full" />
              <NSkeleton className="h-4 w-4/5" />
              <NSkeleton className="h-4 w-3/5" />
              <NSkeleton className="h-4 w-2/3" />
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Different Shapes</h3>
            <div className="flex items-center space-x-4">
              <NSkeleton className="h-12 w-12 rounded-full" />
              <NSkeleton className="h-12 w-12 rounded-md" />
              <NSkeleton className="h-12 w-24 rounded-lg" />
              <NSkeleton className="h-12 w-32 rounded-xl" />
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Avatar with Text</h3>
            <div className="flex items-center space-x-4">
              <NSkeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <NSkeleton className="h-4 w-[200px]" />
                <NSkeleton className="h-4 w-[150px]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Skeleton Layouts */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Card Skeleton Layouts</h2>
        <p className="text-muted-foreground mb-4">Skeleton layouts for different card types.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Card Skeleton */}
          <NCard className="p-4">
            <div className="flex flex-col items-center space-y-4">
              <NSkeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2 text-center w-full">
                <NSkeleton className="h-4 w-32 mx-auto" />
                <NSkeleton className="h-3 w-24 mx-auto" />
              </div>
              <div className="flex space-x-2 w-full">
                <NSkeleton className="h-8 flex-1" />
                <NSkeleton className="h-8 flex-1" />
              </div>
            </div>
          </NCard>

          {/* Article Card Skeleton */}
          <NCard className="p-4">
            <div className="space-y-4">
              <NSkeleton className="h-40 w-full rounded-md" />
              <div className="space-y-2">
                <NSkeleton className="h-4 w-full" />
                <NSkeleton className="h-4 w-4/5" />
                <NSkeleton className="h-4 w-3/5" />
              </div>
              <div className="flex items-center space-x-2">
                <NSkeleton className="h-6 w-6 rounded-full" />
                <NSkeleton className="h-3 w-20" />
                <NSkeleton className="h-3 w-16" />
              </div>
            </div>
          </NCard>

          {/* Product Card Skeleton */}
          <NCard className="p-4">
            <div className="space-y-4">
              <NSkeleton className="h-32 w-full rounded-md" />
              <div className="space-y-2">
                <NSkeleton className="h-4 w-full" />
                <NSkeleton className="h-3 w-2/3" />
                <NSkeleton className="h-5 w-20" />
              </div>
              <div className="flex justify-between items-center">
                <NSkeleton className="h-6 w-16" />
                <NSkeleton className="h-8 w-20" />
              </div>
            </div>
          </NCard>
        </div>
      </div>

      {/* Interactive Loading Demo */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Interactive Loading Demo</h2>
        <p className="text-muted-foreground mb-4">Toggle between skeleton and loaded states.</p>

        <div className="space-y-4">
          <div className="flex space-x-2">
            <NButton onClick={() => simulateLoading(setCardLoading)}>Reload Cards</NButton>
            <NButton onClick={() => simulateLoading(setListLoading)}>Reload List</NButton>
            <NButton onClick={resetAllLoading}>Reset All</NButton>
          </div>

          <NCard className="p-4">
            <h3 className="font-medium mb-4">User Profile</h3>
            {isLoading ? (
              <div className="flex items-center space-x-4">
                <NSkeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2 flex-1">
                  <NSkeleton className="h-4 w-48" />
                  <NSkeleton className="h-3 w-32" />
                  <NSkeleton className="h-3 w-40" />
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className="font-medium">John Doe</h4>
                  <p className="text-sm text-muted-foreground">Software Engineer</p>
                  <p className="text-sm text-muted-foreground">San Francisco, CA</p>
                </div>
              </div>
            )}
          </NCard>
        </div>
      </div>

      {/* List Skeleton */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">List Skeleton</h2>
        <p className="text-muted-foreground mb-4">Skeleton for list items and feeds.</p>

        <NCard className="p-4">
          <h3 className="font-medium mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {listLoading
              ? Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <NSkeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <NSkeleton className="h-3 w-full" />
                      <NSkeleton className="h-3 w-2/3" />
                    </div>
                    <NSkeleton className="h-6 w-16" />
                  </div>
                ))
              : [
                  { icon: Heart, text: 'Sarah liked your post', time: '2m ago', color: 'text-red-500' },
                  { icon: MessageCircle, text: 'New comment on your article', time: '5m ago', color: 'text-blue-500' },
                  { icon: Share2, text: 'Mike shared your content', time: '10m ago', color: 'text-green-500' },
                  { icon: Star, text: 'You received a 5-star rating', time: '15m ago', color: 'text-yellow-500' },
                  { icon: User, text: 'New follower: Alex Johnson', time: '1h ago', color: 'text-purple-500' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{item.text}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                    <span className="text-xs text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">New</span>
                  </div>
                ))}
          </div>
        </NCard>
      </div>

      {/* Table Skeleton */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Table Skeleton</h2>
        <p className="text-muted-foreground mb-4">Skeleton for data tables and structured content.</p>

        <NCard className="p-4">
          <h3 className="font-medium mb-4">User Management</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">User</th>
                  <th className="text-left py-2">Email</th>
                  <th className="text-left py-2">Role</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableLoading
                  ? Array.from({ length: 4 }, (_, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-3">
                          <div className="flex items-center space-x-2">
                            <NSkeleton className="h-8 w-8 rounded-full" />
                            <NSkeleton className="h-3 w-24" />
                          </div>
                        </td>
                        <td className="py-3">
                          <NSkeleton className="h-3 w-32" />
                        </td>
                        <td className="py-3">
                          <NSkeleton className="h-3 w-16" />
                        </td>
                        <td className="py-3">
                          <NSkeleton className="h-5 w-20" />
                        </td>
                        <td className="py-3">
                          <NSkeleton className="h-6 w-16" />
                        </td>
                      </tr>
                    ))
                  : [
                      { name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'Active' },
                      { name: 'Bob Smith', email: 'bob@example.com', role: 'Editor', status: 'Active' },
                      { name: 'Carol White', email: 'carol@example.com', role: 'Viewer', status: 'Inactive' },
                      { name: 'David Brown', email: 'david@example.com', role: 'Editor', status: 'Active' }
                    ].map((user, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-3">
                          <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">{user.email}</td>
                        <td className="py-3 text-sm">{user.role}</td>
                        <td className="py-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              user.status === 'Active'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                            }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <button className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </NCard>
      </div>

      {/* Dashboard Skeleton */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Dashboard Skeleton</h2>
        <p className="text-muted-foreground mb-4">Complex skeleton layout for dashboard interfaces.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {dashboardLoading
            ? Array.from({ length: 4 }, (_, i) => (
                <NCard key={i} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <NSkeleton className="h-4 w-20" />
                      <NSkeleton className="h-4 w-4 rounded" />
                    </div>
                    <NSkeleton className="h-8 w-16" />
                    <NSkeleton className="h-3 w-24" />
                  </div>
                </NCard>
              ))
            : [
                { title: 'Total Users', value: '12,345', change: '+12%', icon: User, color: 'text-blue-500' },
                { title: 'Revenue', value: '$45,678', change: '+8%', icon: CreditCard, color: 'text-green-500' },
                { title: 'Orders', value: '1,234', change: '+15%', icon: ShoppingCart, color: 'text-orange-500' },
                { title: 'Conversion', value: '3.2%', change: '+0.5%', icon: Star, color: 'text-purple-500' }
              ].map((stat, i) => (
                <NCard key={i} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{stat.title}</span>
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-green-600">{stat.change} from last month</div>
                  </div>
                </NCard>
              ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NCard className="p-4">
            <h3 className="font-medium mb-4">Recent Activity</h3>
            {dashboardLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="space-y-2">
                    <NSkeleton className="h-4 w-full" />
                    <NSkeleton className="h-3 w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm">New user registration spike detected</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
                <div>
                  <p className="text-sm">Payment gateway updated successfully</p>
                  <p className="text-xs text-muted-foreground">15 minutes ago</p>
                </div>
                <div>
                  <p className="text-sm">Database backup completed</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
            )}
          </NCard>

          <NCard className="p-4">
            <h3 className="font-medium mb-4">System Status</h3>
            {dashboardLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <NSkeleton className="h-4 w-24" />
                    <NSkeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { name: 'API Server', status: 'Online', color: 'text-green-500' },
                  { name: 'Database', status: 'Online', color: 'text-green-500' },
                  { name: 'Cache', status: 'Online', color: 'text-green-500' },
                  { name: 'CDN', status: 'Degraded', color: 'text-yellow-500' }
                ].map((service, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm">{service.name}</span>
                    <span className={`text-sm font-medium ${service.color}`}>{service.status}</span>
                  </div>
                ))}
              </div>
            )}
          </NCard>
        </div>
      </div>

      {/* Skeleton Best Practices */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Skeleton Best Practices</h2>
        <p className="text-muted-foreground mb-4">Guidelines for effective skeleton implementation.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NCard className="p-4 border-green-200 bg-green-50 dark:bg-green-900/20">
            <h3 className="font-medium text-green-800 dark:text-green-200 mb-3">✅ Do</h3>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-2">
              <li>• Match the layout of actual content</li>
              <li>• Use appropriate shapes and sizes</li>
              <li>• Maintain consistent spacing</li>
              <li>• Show during initial loading</li>
              <li>• Use subtle animations</li>
              <li>• Consider mobile responsiveness</li>
              <li>• Test with real content dimensions</li>
            </ul>
          </NCard>

          <NCard className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
            <h3 className="font-medium text-red-800 dark:text-red-200 mb-3">❌ Don't</h3>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-2">
              <li>• Use for error states (show error messages)</li>
              <li>• Make skeletons too different from content</li>
              <li>• Use overly bright or distracting colors</li>
              <li>• Show skeletons for too long</li>
              <li>• Ignore accessibility considerations</li>
              <li>• Use for quick state changes</li>
              <li>• Forget to handle edge cases</li>
            </ul>
          </NCard>
        </div>
      </div>

      {/* Loading States Summary */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Loading States Summary</h2>
        <p className="text-muted-foreground mb-4">Current loading states across all examples.</p>

        <NCard className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${isLoading ? 'bg-orange-500' : 'bg-green-500'}`}></div>
              <div className="font-medium">Profile</div>
              <div className="text-muted-foreground">{isLoading ? 'Loading' : 'Loaded'}</div>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${cardLoading ? 'bg-orange-500' : 'bg-green-500'}`}></div>
              <div className="font-medium">Cards</div>
              <div className="text-muted-foreground">{cardLoading ? 'Loading' : 'Loaded'}</div>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${listLoading ? 'bg-orange-500' : 'bg-green-500'}`}></div>
              <div className="font-medium">List</div>
              <div className="text-muted-foreground">{listLoading ? 'Loading' : 'Loaded'}</div>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${tableLoading ? 'bg-orange-500' : 'bg-green-500'}`}></div>
              <div className="font-medium">Table</div>
              <div className="text-muted-foreground">{tableLoading ? 'Loading' : 'Loaded'}</div>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${dashboardLoading ? 'bg-orange-500' : 'bg-green-500'}`}></div>
              <div className="font-medium">Dashboard</div>
              <div className="text-muted-foreground">{dashboardLoading ? 'Loading' : 'Loaded'}</div>
            </div>
          </div>
        </NCard>
      </div>
    </ComponentWrapper>
  );
};

export default Skeleton;
