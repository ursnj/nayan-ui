import { useState } from 'react';
import { NButton, NCard, NInput, NPopover, PopoverSize } from '@nayan-ui/react';
import {
  Bell,
  Calendar,
  Camera,
  CreditCard,
  Download,
  Edit,
  FileText,
  Globe,
  Heart,
  HelpCircle,
  Image,
  Info,
  Mail,
  MapPin,
  Minus,
  Package,
  Phone,
  Plus,
  Settings,
  Share,
  ShoppingCart,
  Star,
  Trash2,
  Truck,
  User,
  Video
} from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Popover = () => {
  const [userProfile, setUserProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    status: 'online'
  });
  const [cartItems, setCartItems] = useState(3);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New message received', time: '2m ago', unread: true },
    { id: 2, text: 'Profile updated successfully', time: '1h ago', unread: false },
    { id: 3, text: 'Meeting reminder', time: '3h ago', unread: true }
  ]);
  const [popoverActions, setPopoverActions] = useState<string[]>([]);

  const handleAction = (action: string) => {
    setPopoverActions(prev => [...prev, `${action} - ${new Date().toLocaleTimeString()}`]);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    handleAction('Marked all notifications as read');
  };

  return (
    <ComponentWrapper>
      {/* Basic Popovers */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Basic Popovers</h2>
        <p className="text-muted-foreground mb-4">Simple popovers with basic content and information.</p>

        <div className="flex flex-wrap gap-4">
          <NPopover
            align="start"
            size={PopoverSize.SM}
            trigger={
              <NButton className="flex items-center space-x-2">
                <Info className="w-4 h-4" />
                <span>Info</span>
              </NButton>
            }>
            <div className="p-3">
              <div className="text-sm font-medium text-text mb-1">Quick Info</div>
              <div className="text-sm text-muted-foreground">This is a small informational popover.</div>
            </div>
          </NPopover>

          <NPopover
            align="center"
            size={PopoverSize.MD}
            trigger={
              <NButton isOutline className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4" />
                <span>Help</span>
              </NButton>
            }>
            <div className="p-4">
              <div className="text-sm font-medium text-text mb-2">Need Help?</div>
              <div className="text-sm text-muted-foreground mb-3">Get assistance with your account, billing, or technical issues.</div>
              <div className="flex space-x-2">
                <NButton className="text-xs px-2 py-1" onClick={() => handleAction('Contact Support')}>
                  Contact Support
                </NButton>
                <NButton isOutline className="text-xs px-2 py-1" onClick={() => handleAction('View FAQ')}>
                  View FAQ
                </NButton>
              </div>
            </div>
          </NPopover>

          <NPopover
            align="end"
            size={PopoverSize.LG}
            trigger={<NButton className="bg-purple-500 hover:bg-purple-600 text-white">Documentation</NButton>}>
            <div className="p-4">
              <div className="text-sm font-medium text-text mb-2">Getting Started</div>
              <div className="text-sm text-muted-foreground mb-3">Learn how to integrate our products and tools into your workflow.</div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <FileText className="w-4 h-4" />
                  <span>API Documentation</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Video className="w-4 h-4" />
                  <span>Video Tutorials</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Globe className="w-4 h-4" />
                  <span>Community Forum</span>
                </div>
              </div>
            </div>
          </NPopover>
        </div>
      </div>

      {/* Popover Sizes */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Popover Sizes</h2>
        <p className="text-muted-foreground mb-4">Popovers in different sizes for various content types.</p>

        <div className="flex flex-wrap gap-4">
          <NPopover align="start" size={PopoverSize.SM} trigger={<NButton className="text-sm px-3 py-1">Small</NButton>}>
            <div className="p-2">
              <div className="text-xs font-medium">Small Popover</div>
              <div className="text-xs text-muted-foreground">Compact content</div>
            </div>
          </NPopover>

          <NPopover align="start" size={PopoverSize.MD} trigger={<NButton>Medium</NButton>}>
            <div className="p-3">
              <div className="text-sm font-medium mb-1">Medium Popover</div>
              <div className="text-sm text-muted-foreground">Standard content with more details and information.</div>
            </div>
          </NPopover>

          <NPopover align="start" size={PopoverSize.LG} trigger={<NButton className="px-6 py-3">Large</NButton>}>
            <div className="p-4">
              <div className="text-base font-medium mb-2">Large Popover</div>
              <div className="text-sm text-muted-foreground mb-3">
                Extensive content with multiple sections, detailed information, and interactive elements.
              </div>
              <div className="flex space-x-2">
                <NButton className="text-sm">Primary Action</NButton>
                <NButton isOutline className="text-sm">
                  Secondary
                </NButton>
              </div>
            </div>
          </NPopover>
        </div>
      </div>

      {/* Interactive Popovers */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Interactive Popovers</h2>
        <p className="text-muted-foreground mb-4">Popovers with interactive content and forms.</p>

        <div className="flex flex-wrap gap-4">
          {/* User Profile Popover */}
          <NPopover
            align="start"
            size={PopoverSize.LG}
            trigger={
              <NButton className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </NButton>
            }>
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {userProfile.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium">{userProfile.name}</div>
                  <div className="text-sm text-muted-foreground">{userProfile.email}</div>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${userProfile.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-sm capitalize">{userProfile.status}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <NButton className="text-sm flex-1" onClick={() => handleAction('View Profile')}>
                  View Profile
                </NButton>
                <NButton isOutline className="text-sm flex-1" onClick={() => handleAction('Edit Profile')}>
                  Edit
                </NButton>
              </div>
            </div>
          </NPopover>

          {/* Notifications Popover */}
          <NPopover
            align="center"
            size={PopoverSize.LG}
            trigger={
              <NButton className="flex items-center space-x-2" isOutline>
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
                {notifications.filter(n => n.unread).length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{notifications.filter(n => n.unread).length}</span>
                )}
              </NButton>
            }>
            <div className="p-4 w-80">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Notifications</h3>
                <NButton className="text-xs px-2 py-1" onClick={markAllAsRead} disabled={notifications.filter(n => n.unread).length === 0}>
                  Mark all read
                </NButton>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-2 rounded border ${notification.unread ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="text-sm">{notification.text}</div>
                    <div className="text-xs text-muted-foreground mt-1">{notification.time}</div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t">
                <NButton className="text-sm w-full" isOutline onClick={() => handleAction('View All Notifications')}>
                  View All Notifications
                </NButton>
              </div>
            </div>
          </NPopover>

          {/* Shopping Cart Popover */}
          <NPopover
            align="end"
            size={PopoverSize.LG}
            trigger={
              <NButton className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white">
                <ShoppingCart className="w-4 h-4" />
                <span>Cart</span>
                {cartItems > 0 && <span className="bg-white text-green-600 text-xs rounded-full px-1.5 py-0.5 font-medium">{cartItems}</span>}
              </NButton>
            }>
            <div className="p-4 w-72">
              <h3 className="font-medium mb-3">Shopping Cart</h3>

              {cartItems > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-2 border rounded">
                    <Image className="w-8 h-8 text-gray-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Product Name</div>
                      <div className="text-xs text-muted-foreground">$29.99</div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <NButton className="p-1" onClick={() => setCartItems(Math.max(0, cartItems - 1))}>
                        <Minus className="w-3 h-3" />
                      </NButton>
                      <span className="text-sm px-2">{cartItems}</span>
                      <NButton className="p-1" onClick={() => setCartItems(cartItems + 1)}>
                        <Plus className="w-3 h-3" />
                      </NButton>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-medium">Total: ${(29.99 * cartItems).toFixed(2)}</span>
                  </div>

                  <div className="flex space-x-2">
                    <NButton className="text-sm flex-1" onClick={() => handleAction('Proceed to Checkout')}>
                      Checkout
                    </NButton>
                    <NButton isOutline className="text-sm" onClick={() => handleAction('View Cart')}>
                      View Cart
                    </NButton>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-muted-foreground">Your cart is empty</p>
                </div>
              )}
            </div>
          </NPopover>
        </div>
      </div>

      {/* Best Practices */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Popover Best Practices</h2>
        <p className="text-muted-foreground mb-4">Guidelines for effective popover design and implementation.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NCard className="p-4 border-green-200 bg-green-50 dark:bg-green-900/20">
            <h3 className="font-medium text-green-800 dark:text-green-200 mb-3">✅ Do</h3>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-2">
              <li>• Use appropriate popover sizes for content</li>
              <li>• Provide clear trigger elements</li>
              <li>• Keep content concise and focused</li>
              <li>• Use proper alignment based on context</li>
              <li>• Include interactive elements when needed</li>
              <li>• Ensure popovers are dismissible</li>
            </ul>
          </NCard>

          <NCard className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
            <h3 className="font-medium text-red-800 dark:text-red-200 mb-3">❌ Don't</h3>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-2">
              <li>• Overcrowd popovers with too much content</li>
              <li>• Use popovers for critical information</li>
              <li>• Make popovers too small for their content</li>
              <li>• Nest popovers within other popovers</li>
              <li>• Use popovers on mobile without consideration</li>
              <li>• Forget to handle popover positioning</li>
            </ul>
          </NCard>
        </div>
      </div>

      {/* Action Summary */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Popover Action Summary</h2>
        <p className="text-muted-foreground mb-4">Track interactions with the popovers above.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NCard className="p-4">
            <h3 className="font-medium mb-3">Recent Actions</h3>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {popoverActions.length > 0 ? (
                popoverActions
                  .slice(-5)
                  .reverse()
                  .map((action, index) => (
                    <div key={index} className="text-xs p-2 bg-card rounded">
                      {action}
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No actions yet</p>
              )}
            </div>
          </NCard>

          <NCard className="p-4">
            <h3 className="font-medium mb-3">Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Actions:</span>
                <span className="font-medium">{popoverActions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Cart Items:</span>
                <span className="font-medium">{cartItems}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Unread Notifications:</span>
                <span className="font-medium">{notifications.filter(n => n.unread).length}</span>
              </div>
            </div>
          </NCard>
        </div>
      </div>
    </ComponentWrapper>
  );
};

export default Popover;
