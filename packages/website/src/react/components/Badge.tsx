import { NBadge } from '@nayan-ui/react';
import { AlertCircle, Bell, ShoppingCart, Star, Users } from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Badge = () => {
  return (
    <ComponentWrapper>
      {/* Basic Badges */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Basic Badges</h2>
        <p className="text-muted-foreground mb-4">Simple badges with different colors and styles.</p>

        <div className="flex flex-wrap gap-2">
          <NBadge className="bg-gray-100 text-gray-800 border border-gray-300">Default</NBadge>
          <NBadge className="bg-blue-100 text-blue-800 border border-blue-300">Info</NBadge>
          <NBadge className="bg-green-100 text-green-800 border border-green-300">Success</NBadge>
          <NBadge className="bg-yellow-100 text-yellow-800 border border-yellow-300">Warning</NBadge>
          <NBadge className="bg-red-100 text-red-800 border border-red-300">Error</NBadge>
        </div>
      </div>

      {/* Solid Badges */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Solid Badges</h2>
        <p className="text-muted-foreground mb-4">Badges with solid background colors.</p>

        <div className="flex flex-wrap gap-2">
          <NBadge className="bg-gray-600 text-white">Default</NBadge>
          <NBadge className="bg-blue-600 text-white">Primary</NBadge>
          <NBadge className="bg-green-600 text-white">Success</NBadge>
          <NBadge className="bg-yellow-600 text-white">Warning</NBadge>
          <NBadge className="bg-red-600 text-white">Danger</NBadge>
          <NBadge className="bg-purple-600 text-white">Purple</NBadge>
        </div>
      </div>

      {/* Badge Sizes */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Badge Sizes</h2>
        <p className="text-muted-foreground mb-4">Different sizes for various use cases.</p>

        <div className="flex flex-wrap items-center gap-3">
          <NBadge className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5">Small</NBadge>
          <NBadge className="bg-blue-100 text-blue-800 text-sm px-2 py-1">Medium</NBadge>
          <NBadge className="bg-blue-100 text-blue-800 text-base px-3 py-1.5">Large</NBadge>
          <NBadge className="bg-blue-100 text-blue-800 text-lg px-4 py-2">Extra Large</NBadge>
        </div>
      </div>

      {/* Badges with Icons */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Badges with Icons</h2>
        <p className="text-muted-foreground mb-4">Add icons to provide more context.</p>

        <div className="flex flex-wrap gap-2">
          <NBadge className="bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
            <Bell className="w-3 h-3" />
            Notifications
          </NBadge>

          <NBadge className="bg-yellow-100 text-yellow-800 border border-yellow-300 flex items-center gap-1">
            <Star className="w-3 h-3" />
            Featured
          </NBadge>

          <NBadge className="bg-green-100 text-green-800 border border-green-300 flex items-center gap-1">
            <Users className="w-3 h-3" />
            Team
          </NBadge>

          <NBadge className="bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
            <ShoppingCart className="w-3 h-3" />
            Cart
          </NBadge>
        </div>
      </div>

      {/* Notification Badges */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Notification Badges</h2>
        <p className="text-muted-foreground mb-4">Small badges for counts and notifications.</p>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Bell className="w-6 h-6 text-gray-600" />
            <NBadge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center p-0 min-w-0">3</NBadge>
          </div>

          <div className="relative">
            <ShoppingCart className="w-6 h-6 text-gray-600" />
            <NBadge className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs w-5 h-5 flex items-center justify-center p-0 min-w-0">
              12
            </NBadge>
          </div>

          <div className="relative">
            <Users className="w-6 h-6 text-gray-600" />
            <NBadge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs w-5 h-5 flex items-center justify-center p-0 min-w-0">
              99+
            </NBadge>
          </div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Status Badges</h2>
        <p className="text-muted-foreground mb-4">Indicate status or state with colored badges.</p>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-text">Order Status:</span>
            <NBadge className="bg-green-100 text-green-800 border border-green-300">Completed</NBadge>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-text">Payment:</span>
            <NBadge className="bg-yellow-100 text-yellow-800 border border-yellow-300">Pending</NBadge>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-text">Subscription:</span>
            <NBadge className="bg-blue-100 text-blue-800 border border-blue-300">Active</NBadge>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-text">Account:</span>
            <NBadge className="bg-red-100 text-red-800 border border-red-300">Suspended</NBadge>
          </div>
        </div>
      </div>

      {/* Interactive Badges */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Interactive Badges</h2>
        <p className="text-muted-foreground mb-4">Badges that respond to user interaction.</p>

        <div className="flex flex-wrap gap-2">
          <NBadge
            className="bg-blue-100 text-blue-800 border border-blue-300 cursor-pointer hover:bg-blue-200 transition-colors"
            onClick={() => alert('Badge clicked!')}>
            Clickable
          </NBadge>

          <NBadge
            className="bg-green-100 text-green-800 border border-green-300 cursor-pointer hover:bg-green-200 transition-colors flex items-center gap-1"
            onClick={() => alert('Tag selected!')}>
            <span>Tag</span>
            <span className="text-green-600 hover:text-green-800">×</span>
          </NBadge>

          <NBadge
            className="bg-purple-100 text-purple-800 border border-purple-300 cursor-pointer hover:bg-purple-200 transition-colors"
            onClick={() => alert('Filter applied!')}>
            Filter
          </NBadge>
        </div>
      </div>

      {/* Custom Shapes */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Custom Shapes</h2>
        <p className="text-muted-foreground mb-4">Badges with different shapes and borders.</p>

        <div className="flex flex-wrap gap-2">
          <NBadge className="bg-blue-100 text-blue-800 border border-blue-300 rounded-none">Square</NBadge>
          <NBadge className="bg-green-100 text-green-800 border border-green-300 rounded-md">Rounded</NBadge>
          <NBadge className="bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-full">Pill</NBadge>
          <NBadge className="bg-red-100 text-red-800 border-2 border-red-400 border-dashed">Dashed</NBadge>
          <NBadge className="bg-purple-100 text-purple-800 border-l-4 border-l-purple-500 border-t border-r border-b border-purple-300 rounded-none">
            Left Border
          </NBadge>
        </div>
      </div>

      {/* Accessibility Example */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Accessibility</h2>
        <p className="text-muted-foreground mb-4">Badges with proper ARIA attributes for screen readers.</p>

        <div className="flex flex-wrap gap-2">
          <NBadge className="bg-red-100 text-red-800 border border-red-300 flex items-center gap-1" role="status" aria-label="Critical alert">
            <AlertCircle className="w-3 h-3" />
            Critical
          </NBadge>

          <NBadge className="bg-blue-100 text-blue-800 border border-blue-300" role="status" aria-label="5 unread notifications">
            5 New
          </NBadge>

          <NBadge className="bg-green-100 text-green-800 border border-green-300" role="img" aria-label="Verified account">
            ✓ Verified
          </NBadge>
        </div>
      </div>
    </ComponentWrapper>
  );
};

export default Badge;
