import { NDivider } from '@nayan-ui/react';
import { Heart, Mail, Phone, Settings, Star, User } from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Divider = () => {
  return (
    <ComponentWrapper>
      {/* Basic Horizontal Dividers */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Basic Horizontal Dividers</h2>
        <p className="text-muted-foreground mb-4">Simple horizontal dividers to separate content sections.</p>

        <div className="space-y-6">
          <div>
            <p className="text-sm mb-2">Content above the divider</p>
            <NDivider orientation="horizontal" />
            <p className="text-sm mt-2">Content below the divider</p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Section 1</h3>
            <p className="text-sm text-muted-foreground mb-4">This is the first section with some content to demonstrate the divider.</p>
            <NDivider orientation="horizontal" className="my-4" />
            <h3 className="font-medium mb-2">Section 2</h3>
            <p className="text-sm text-muted-foreground">This is the second section separated by a horizontal divider.</p>
          </div>
        </div>
      </div>

      {/* Horizontal Dividers with Text */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Dividers with Text</h2>
        <p className="text-muted-foreground mb-4">Dividers with text labels for better context.</p>

        <div className="space-y-6">
          <div>
            <p className="text-sm mb-4">Choose your preferred login method:</p>
            <button className="w-full p-2 bg-blue-500 text-white rounded mb-2">Continue with Email</button>
            <NDivider orientation="horizontal" className="my-4">
              OR
            </NDivider>
            <button className="w-full p-2 border border-gray-300 rounded">Continue with Google</button>
          </div>

          <div>
            <div className="p-4 bg-card rounded mb-4">
              <h3 className="font-medium">Free Plan</h3>
              <p className="text-sm text-muted-foreground">Basic features included</p>
            </div>
            <NDivider orientation="horizontal" className="my-4">
              UPGRADE
            </NDivider>
            <div className="p-4 bg-card rounded">
              <h3 className="font-medium">Pro Plan</h3>
              <p className="text-sm text-muted-foreground">All features included</p>
            </div>
          </div>

          <div>
            <div className="text-center mb-4">
              <h3 className="font-medium">Recent Activity</h3>
            </div>
            <NDivider orientation="horizontal" className="my-4">
              TODAY
            </NDivider>
            <div className="space-y-2">
              <p className="text-sm">• Updated profile information</p>
              <p className="text-sm">• Completed onboarding</p>
            </div>
            <NDivider orientation="horizontal" className="my-4">
              YESTERDAY
            </NDivider>
            <div className="space-y-2">
              <p className="text-sm">• Created new project</p>
              <p className="text-sm">• Invited team members</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vertical Dividers */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Vertical Dividers</h2>
        <p className="text-muted-foreground mb-4">Vertical dividers for inline content separation.</p>

        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm">Home</span>
            <NDivider orientation="vertical" className="h-4" />
            <span className="text-sm">About</span>
            <NDivider orientation="vertical" className="h-4" />
            <span className="text-sm">Contact</span>
          </div>

          <div className="flex items-center space-x-4">
            <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded">Save</button>
            <NDivider orientation="vertical" className="h-6" />
            <button className="px-3 py-1 text-sm border border-gray-300 rounded">Cancel</button>
            <NDivider orientation="vertical" className="h-6" />
            <button className="px-3 py-1 text-sm text-red-600">Delete</button>
          </div>

          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>Published: March 15, 2024</span>
            <NDivider orientation="vertical" className="h-4" />
            <span>Author: John Doe</span>
            <NDivider orientation="vertical" className="h-4" />
            <span>5 min read</span>
          </div>
        </div>
      </div>

      {/* Custom Styled Dividers */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Custom Styled Dividers</h2>
        <p className="text-muted-foreground mb-4">Dividers with custom colors and styling.</p>

        <div className="space-y-6">
          <div>
            <p className="text-sm mb-2">Success section</p>
            <NDivider orientation="horizontal" className="border-green-300 dark:border-green-700" />
            <p className="text-sm mt-2 text-green-600">Operation completed successfully</p>
          </div>

          <div>
            <p className="text-sm mb-2">Warning section</p>
            <NDivider orientation="horizontal" className="border-yellow-300 dark:border-yellow-700" />
            <p className="text-sm mt-2 text-yellow-600">Please review the following items</p>
          </div>

          <div>
            <p className="text-sm mb-2">Error section</p>
            <NDivider orientation="horizontal" className="border-red-300 dark:border-red-700" />
            <p className="text-sm mt-2 text-red-600">An error occurred during processing</p>
          </div>

          <div>
            <p className="text-sm mb-2">Thick divider</p>
            <NDivider orientation="horizontal" className="border-t-2 border-gray-300 dark:border-gray-700" />
            <p className="text-sm mt-2">Content with thick separator</p>
          </div>

          <div>
            <p className="text-sm mb-2">Dashed divider</p>
            <NDivider orientation="horizontal" className="border-dashed border-gray-300 dark:border-gray-700" />
            <p className="text-sm mt-2">Content with dashed separator</p>
          </div>

          <div>
            <p className="text-sm mb-2">Dotted divider</p>
            <NDivider orientation="horizontal" className="border-dotted border-gray-300 dark:border-gray-700" />
            <p className="text-sm mt-2">Content with dotted separator</p>
          </div>
        </div>
      </div>

      {/* Dividers with Icons */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Dividers with Icons</h2>
        <p className="text-muted-foreground mb-4">Dividers enhanced with icons for visual appeal.</p>

        <div className="space-y-6">
          <div>
            <div className="text-center mb-4">
              <h3 className="font-medium">Customer Reviews</h3>
            </div>
            <NDivider orientation="horizontal" className="my-4">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>5 STARS</span>
                <Star className="w-4 h-4 text-yellow-500" />
              </div>
            </NDivider>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Amazing product! Highly recommended.</p>
            </div>
          </div>

          <div>
            <div className="p-4 border rounded mb-4">
              <h3 className="font-medium">Favorite Items</h3>
              <p className="text-sm text-muted-foreground">Items you've marked as favorites</p>
            </div>
            <NDivider orientation="horizontal" className="my-4">
              <Heart className="w-4 h-4 text-red-500" />
            </NDivider>
            <div className="p-4 border rounded">
              <h3 className="font-medium">Wishlist</h3>
              <p className="text-sm text-muted-foreground">Items you want to buy later</p>
            </div>
          </div>

          <div>
            <div className="text-center mb-4">
              <h3 className="font-medium">Account Settings</h3>
            </div>
            <NDivider orientation="horizontal" className="my-4">
              <Settings className="w-4 h-4 text-gray-500" />
            </NDivider>
            <div className="space-y-2">
              <p className="text-sm">• Profile information</p>
              <p className="text-sm">• Privacy settings</p>
              <p className="text-sm">• Notification preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section Dividers */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Form Section Dividers</h2>
        <p className="text-muted-foreground mb-4">Dividers to organize form sections clearly.</p>

        <div className="max-w-md mx-auto p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">User Registration</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input type="text" className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input type="text" className="w-full p-2 border rounded" />
            </div>
          </div>

          <NDivider orientation="horizontal" className="my-6">
            <User className="w-4 h-4 text-gray-500" />
          </NDivider>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input type="tel" className="w-full p-2 border rounded" />
            </div>
          </div>

          <NDivider orientation="horizontal" className="my-6">
            CONTACT INFO
          </NDivider>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input type="password" className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <input type="password" className="w-full p-2 border rounded" />
            </div>
          </div>

          <NDivider orientation="horizontal" className="my-6" />

          <button className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Create Account</button>
        </div>
      </div>

      {/* Navigation Dividers */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Navigation Dividers</h2>
        <p className="text-muted-foreground mb-4">Dividers in navigation menus and breadcrumbs.</p>

        <div className="space-y-6">
          <div className="flex items-center space-x-2 text-sm">
            <a href="#" className="text-blue-500 hover:underline">
              Home
            </a>
            <NDivider orientation="vertical" className="h-4" />
            <a href="#" className="text-blue-500 hover:underline">
              Products
            </a>
            <NDivider orientation="vertical" className="h-4" />
            <a href="#" className="text-blue-500 hover:underline">
              Electronics
            </a>
            <NDivider orientation="vertical" className="h-4" />
            <span className="text-muted-foreground">Smartphones</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-card rounded">
            <div className="flex items-center space-x-4">
              <span className="font-medium">Dashboard</span>
              <NDivider orientation="vertical" className="h-5" />
              <span>Analytics</span>
              <NDivider orientation="vertical" className="h-5" />
              <span>Reports</span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                <Mail className="w-4 h-4" />
              </button>
              <NDivider orientation="vertical" className="h-4" />
              <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                <Phone className="w-4 h-4" />
              </button>
              <NDivider orientation="vertical" className="h-4" />
              <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Layout Dividers */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Content Layout Dividers</h2>
        <p className="text-muted-foreground mb-4">Dividers for organizing complex content layouts.</p>

        <div className="space-y-6">
          <div className="border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Article Title</h3>
              <span className="text-sm text-muted-foreground">March 15, 2024</span>
            </div>

            <p className="text-muted-foreground mb-4">This is the article excerpt that gives readers a preview of the content...</p>

            <NDivider orientation="horizontal" className="my-4" />

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span>By John Doe</span>
                <NDivider orientation="vertical" className="h-4" />
                <span>5 min read</span>
                <NDivider orientation="vertical" className="h-4" />
                <span>Technology</span>
              </div>
              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-1 text-muted-foreground hover:text-red-500">
                  <Heart className="w-4 h-4" />
                  <span>24</span>
                </button>
                <NDivider orientation="vertical" className="h-4" />
                <button className="text-muted-foreground hover:text-blue-500">Share</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h3 className="font-semibold mb-2">Main Content</h3>
              <p className="text-sm text-muted-foreground mb-4">This is the main content area with detailed information and primary content.</p>
              <NDivider orientation="horizontal" className="my-4" />
              <p className="text-sm text-muted-foreground">Additional content continues here with more detailed information.</p>
            </div>

            <div className="md:block hidden">
              <NDivider orientation="vertical" className="h-full mx-4" />
            </div>
            <div className="md:hidden">
              <NDivider orientation="horizontal" className="my-4" />
            </div>

            <div>
              <h3 className="font-semibold mb-2">Sidebar</h3>
              <div className="space-y-3">
                <div className="p-3 bg-card rounded">
                  <h4 className="text-sm font-medium">Related Article 1</h4>
                </div>
                <NDivider orientation="horizontal" />
                <div className="p-3 bg-card rounded">
                  <h4 className="text-sm font-medium">Related Article 2</h4>
                </div>
                <NDivider orientation="horizontal" />
                <div className="p-3 bg-card rounded">
                  <h4 className="text-sm font-medium">Related Article 3</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacing Examples */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Spacing Examples</h2>
        <p className="text-muted-foreground mb-4">Different spacing options for dividers.</p>

        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-medium mb-2">Tight spacing</h3>
            <p className="text-sm text-muted-foreground">Content above</p>
            <NDivider orientation="horizontal" className="my-1" />
            <p className="text-sm text-muted-foreground">Content below</p>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Normal spacing</h3>
            <p className="text-sm text-muted-foreground">Content above</p>
            <NDivider orientation="horizontal" className="my-4" />
            <p className="text-sm text-muted-foreground">Content below</p>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Loose spacing</h3>
            <p className="text-sm text-muted-foreground">Content above</p>
            <NDivider orientation="horizontal" className="my-8" />
            <p className="text-sm text-muted-foreground">Content below</p>
          </div>
        </div>
      </div>
    </ComponentWrapper>
  );
};

export default Divider;
