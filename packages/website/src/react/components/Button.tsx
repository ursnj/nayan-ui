import { useState } from 'react';
import { NButton } from '@nayan-ui/react';
import { Download, Heart, Plus, Search, Settings, Share2, Trash2 } from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Button = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  return (
    <ComponentWrapper>
      {/* Basic Buttons */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Basic Buttons</h2>
        <p className="text-muted-foreground mb-4">Standard button styles with different visual treatments.</p>

        <div className="flex flex-wrap gap-3">
          <NButton onClick={() => alert('Primary clicked!')}>Primary Button</NButton>

          <NButton isOutline onClick={() => alert('Outline clicked!')}>
            Outline Button
          </NButton>

          <NButton className="bg-secondary text-secondary-foreground hover:bg-secondary/80" onClick={() => alert('Secondary clicked!')}>
            Secondary Button
          </NButton>

          <NButton className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => alert('Destructive clicked!')}>
            Destructive Button
          </NButton>
        </div>
      </div>

      {/* Button States */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Button States</h2>
        <p className="text-muted-foreground mb-4">Different states including disabled and loading.</p>

        <div className="flex flex-wrap gap-3">
          <NButton onClick={() => alert('Normal clicked!')}>Normal</NButton>

          <NButton disabled>Disabled</NButton>

          <NButton isLoading={isLoading} loadingText="Processing..." onClick={handleLoadingDemo}>
            {isLoading ? 'Loading...' : 'Click to Load'}
          </NButton>

          <NButton isLoading={true} loadingText="Saving changes...">
            Always Loading
          </NButton>
        </div>
      </div>

      {/* Button Sizes */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Button Sizes</h2>
        <p className="text-muted-foreground mb-4">Different sizes using className customization.</p>

        <div className="flex flex-wrap items-center gap-3">
          <NButton className="px-2 py-1 text-xs h-auto">Small</NButton>

          <NButton className="px-3 py-2 text-sm h-auto">Medium</NButton>

          <NButton className="px-4 py-3 text-base h-auto">Large</NButton>

          <NButton className="px-6 py-4 text-lg h-auto">Extra Large</NButton>
        </div>
      </div>

      {/* Buttons with Icons */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Buttons with Icons</h2>
        <p className="text-muted-foreground mb-4">Add icons to provide visual context.</p>

        <div className="flex flex-wrap gap-3">
          <NButton className="flex items-center gap-2" onClick={() => alert('Download started!')}>
            <Download className="w-4 h-4" />
            Download
          </NButton>

          <NButton className="flex items-center gap-2 bg-green-600 hover:bg-green-700" onClick={() => alert('Item added!')}>
            <Plus className="w-4 h-4" />
            Add Item
          </NButton>

          <NButton isOutline className="flex items-center gap-2" onClick={() => alert('Settings opened!')}>
            <Settings className="w-4 h-4" />
            Settings
          </NButton>

          <NButton className="flex items-center gap-2 bg-red-600 hover:bg-red-700" onClick={() => alert('Item deleted!')}>
            <Trash2 className="w-4 h-4" />
            Delete
          </NButton>
        </div>
      </div>

      {/* Icon Only Buttons */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Icon Only Buttons</h2>
        <p className="text-muted-foreground mb-4">Compact buttons with only icons.</p>

        <div className="flex flex-wrap gap-3">
          <NButton className="w-10 h-10 p-0 flex items-center justify-center" onClick={() => alert('Liked!')} aria-label="Like">
            <Heart className="w-4 h-4" />
          </NButton>

          <NButton isOutline className="w-10 h-10 p-0 flex items-center justify-center" onClick={() => alert('Shared!')} aria-label="Share">
            <Share2 className="w-4 h-4" />
          </NButton>

          <NButton
            className="w-10 h-10 p-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700"
            onClick={() => alert('Searching!')}
            aria-label="Search">
            <Search className="w-4 h-4" />
          </NButton>

          <NButton className="w-8 h-8 p-0 flex items-center justify-center text-xs" onClick={() => alert('Small action!')} aria-label="Small action">
            <Plus className="w-3 h-3" />
          </NButton>
        </div>
      </div>

      {/* Button Shapes */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Button Shapes</h2>
        <p className="text-muted-foreground mb-4">Different border radius and shapes.</p>

        <div className="flex flex-wrap gap-3">
          <NButton className="rounded-none">Square</NButton>

          <NButton className="rounded-md">Rounded</NButton>

          <NButton className="rounded-full px-6">Pill Shape</NButton>

          <NButton className="rounded-full w-12 h-12 p-0 flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </NButton>
        </div>
      </div>

      {/* Form Buttons */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Form Buttons</h2>
        <p className="text-muted-foreground mb-4">Buttons with different form types and behaviors.</p>

        <div className="space-y-4">
          <form
            onSubmit={e => {
              e.preventDefault();
              alert('Form submitted!');
            }}
            className="flex gap-3">
            <NButton type="submit">Submit Form</NButton>

            <NButton type="reset" isOutline onClick={() => alert('Form reset!')}>
              Reset Form
            </NButton>

            <NButton type="button" className="bg-gray-500 hover:bg-gray-600" onClick={() => alert('Cancel clicked!')}>
              Cancel
            </NButton>
          </form>
        </div>
      </div>

      {/* Loading States */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Loading States</h2>
        <p className="text-muted-foreground mb-4">Different loading scenarios with custom text.</p>

        <div className="flex flex-wrap gap-3">
          <NButton isLoading={true} loadingText="Saving...">
            Save Changes
          </NButton>

          <NButton isLoading={true} loadingText="Uploading..." className="bg-blue-600 hover:bg-blue-700">
            Upload File
          </NButton>

          <NButton isLoading={true} loadingText="Processing payment..." className="bg-green-600 hover:bg-green-700">
            Pay Now
          </NButton>

          <NButton isOutline isLoading={true} loadingText="Loading data...">
            Fetch Data
          </NButton>
        </div>
      </div>

      {/* Custom Styled Buttons */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Custom Styled Buttons</h2>
        <p className="text-muted-foreground mb-4">Buttons with custom colors and effects.</p>

        <div className="flex flex-wrap gap-3">
          <NButton className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none">
            Gradient Button
          </NButton>

          <NButton className="bg-yellow-400 text-black hover:bg-yellow-500 border-yellow-400 shadow-lg">Bright Button</NButton>

          <NButton className="bg-transparent text-blue-600 border-2 border-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300">
            Animated Hover
          </NButton>

          <NButton className="bg-black text-white hover:bg-gray-800 shadow-2xl transform hover:scale-105 transition-transform">Scale Effect</NButton>
        </div>
      </div>

      {/* Button Groups */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Button Groups</h2>
        <p className="text-muted-foreground mb-4">Related buttons grouped together.</p>

        <div className="space-y-4">
          <div className="flex">
            <NButton className="rounded-r-none border-r-0">Left</NButton>
            <NButton className="rounded-none border-r-0">Center</NButton>
            <NButton className="rounded-l-none">Right</NButton>
          </div>

          <div className="flex gap-2">
            <NButton className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download
            </NButton>
            <NButton isOutline className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </NButton>
            <NButton className="bg-red-600 hover:bg-red-700 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete
            </NButton>
          </div>
        </div>
      </div>

      {/* Accessibility Example */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Accessibility</h2>
        <p className="text-muted-foreground mb-4">Buttons with proper ARIA attributes and labels.</p>

        <div className="flex flex-wrap gap-3">
          <NButton aria-label="Close dialog" className="w-8 h-8 p-0 flex items-center justify-center">
            ×
          </NButton>

          <NButton aria-describedby="save-help" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Save Document
          </NButton>
          <div id="save-help" className="text-xs text-muted-foreground">
            Saves the current document to your device
          </div>

          <NButton disabled aria-label="Delete item (disabled because no item is selected)" className="bg-red-600 hover:bg-red-700">
            Delete
          </NButton>
        </div>
      </div>
    </ComponentWrapper>
  );
};

export default Button;
