import { useState } from 'react';
import { NButtonGroup } from '@nayan-ui/react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const ButtonGroup = () => {
  const [selectedPlan, setSelectedPlan] = useState('Business');
  const [selectedSize, setSelectedSize] = useState('Medium');
  const [selectedAlignment, setSelectedAlignment] = useState('Center');
  const [selectedView, setSelectedView] = useState('Grid');
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Different data types for examples
  const planItems = ['Startup', 'Business', 'Enterprise'];
  const sizeItems = ['Small', 'Medium', 'Large'];
  const alignmentItems = ['Left', 'Center', 'Right'];
  const viewItems = ['List', 'Grid', 'Card'];
  const filterItems = ['All', 'Active', 'Completed', 'Pending'];

  // Custom styled items
  const priorityItems = ['Low', 'Medium', 'High'];
  const [selectedPriority, setSelectedPriority] = useState('Medium');

  // Number-based items
  const ratingItems = [1, 2, 3, 4, 5];
  const [selectedRating, setSelectedRating] = useState(3);

  return (
    <ComponentWrapper>
      {/* Basic Button Group */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Basic Button Group</h2>
        <p className="text-muted-foreground mb-4">Simple button group with string items and selection state.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Choose your plan:</label>
            <NButtonGroup items={planItems} selected={selectedPlan} onChange={setSelectedPlan} ariaLabel="Select subscription plan" />
            <p className="text-sm text-muted-foreground mt-2">
              Selected: <strong>{selectedPlan}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Button Group Sizes */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Different Sizes</h2>
        <p className="text-muted-foreground mb-4">Button groups with different button sizes using custom styling.</p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Small buttons:</label>
            <NButtonGroup
              items={sizeItems}
              selected={selectedSize}
              onChange={setSelectedSize}
              buttonClassName="px-2 py-1 text-xs"
              ariaLabel="Select size (small buttons)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Large buttons:</label>
            <NButtonGroup
              items={alignmentItems}
              selected={selectedAlignment}
              onChange={setSelectedAlignment}
              buttonClassName="px-6 py-3 text-lg"
              ariaLabel="Select alignment (large buttons)"
            />
          </div>
        </div>
      </div>

      {/* Custom Styled Button Group */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Custom Styling</h2>
        <p className="text-muted-foreground mb-4">Button groups with custom colors and styling.</p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">View mode:</label>
            <NButtonGroup
              items={viewItems}
              selected={selectedView}
              onChange={setSelectedView}
              className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg"
              buttonClassName="data-[state=active]:bg-blue-500 data-[state=active]:text-white hover:bg-blue-100 dark:hover:bg-blue-900"
              ariaLabel="Select view mode"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Priority level:</label>
            <NButtonGroup
              items={priorityItems}
              selected={selectedPriority}
              onChange={setSelectedPriority}
              buttonClassName="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
              ariaLabel="Select priority level"
            />
          </div>
        </div>
      </div>

      {/* Number-based Button Group */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Number-based Selection</h2>
        <p className="text-muted-foreground mb-4">Button group with numeric values for ratings or quantities.</p>

        <div>
          <label className="block text-sm font-medium mb-2">Rate this item:</label>
          <NButtonGroup
            items={ratingItems}
            selected={selectedRating}
            onChange={setSelectedRating}
            buttonClassName="w-12 h-12 rounded-full data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
            ariaLabel="Rate from 1 to 5 stars"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Rating: <strong>{selectedRating}/5 stars</strong>
          </p>
        </div>
      </div>

      {/* Disabled Button Group */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Disabled State</h2>
        <p className="text-muted-foreground mb-4">Button group in disabled state.</p>

        <div>
          <label className="block text-sm font-medium mb-2 opacity-50">Filter options (disabled):</label>
          <NButtonGroup
            items={filterItems}
            selected={selectedFilter}
            onChange={setSelectedFilter}
            disabled={true}
            ariaLabel="Filter options (disabled)"
          />
          <p className="text-sm text-muted-foreground mt-2 opacity-50">This button group is disabled and cannot be interacted with.</p>
        </div>
      </div>

      {/* Vertical Button Group */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Vertical Layout</h2>
        <p className="text-muted-foreground mb-4">Button group arranged vertically using custom styling.</p>

        <div>
          <label className="block text-sm font-medium mb-2">Navigation menu:</label>
          <NButtonGroup
            items={['Dashboard', 'Analytics', 'Settings']}
            selected="Dashboard"
            onChange={() => {}}
            className="flex-col w-48"
            buttonClassName="w-full justify-start rounded-none first:rounded-t-lg last:rounded-b-lg border-b-0 last:border-b"
            ariaLabel="Navigation menu"
          />
        </div>
      </div>

      {/* Compact Button Group */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Compact Style</h2>
        <p className="text-muted-foreground mb-4">Minimal spacing and compact design for tight layouts.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Text formatting:</label>
            <NButtonGroup
              items={['B', 'I', 'U']}
              selected="B"
              onChange={() => {}}
              buttonClassName="w-8 h-8 p-0 text-sm font-bold"
              ariaLabel="Text formatting options"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Zoom level:</label>
            <NButtonGroup
              items={['25%', '50%', '75%', '100%', '125%']}
              selected="100%"
              onChange={() => {}}
              buttonClassName="px-2 py-1 text-xs min-w-12"
              ariaLabel="Zoom level selection"
            />
          </div>
        </div>
      </div>

      {/* Interactive Examples */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Interactive Examples</h2>
        <p className="text-muted-foreground mb-4">Button groups with real-world interactions and feedback.</p>

        <div className="space-y-6">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-3">Theme Selector</h3>
            <NButtonGroup
              items={['Light', 'Dark', 'Auto']}
              selected="Light"
              onChange={theme => {
                console.log(`Theme changed to: ${theme}`);
                // In a real app, this would update the theme
              }}
              buttonClassName="px-4 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              ariaLabel="Select theme"
            />
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-3">Language Selector</h3>
            <NButtonGroup
              items={['EN', 'ES', 'FR', 'DE']}
              selected="EN"
              onChange={lang => {
                console.log(`Language changed to: ${lang}`);
              }}
              buttonClassName="w-12 h-10 text-sm font-medium"
              ariaLabel="Select language"
            />
          </div>
        </div>
      </div>

      {/* Accessibility Example */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Accessibility</h2>
        <p className="text-muted-foreground mb-4">Button group with proper ARIA labels and keyboard navigation.</p>

        <div>
          <label className="block text-sm font-medium mb-2">Sort order (use arrow keys to navigate):</label>
          <NButtonGroup
            items={['Newest', 'Oldest', 'A-Z', 'Z-A']}
            selected="Newest"
            onChange={order => {
              console.log(`Sort order changed to: ${order}`);
            }}
            ariaLabel="Sort order selection - use arrow keys to navigate between options"
            className="focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 rounded-lg"
          />
          <p className="text-xs text-muted-foreground mt-2">
            This button group supports keyboard navigation with arrow keys and has proper ARIA labeling.
          </p>
        </div>
      </div>
    </ComponentWrapper>
  );
};

export default ButtonGroup;
