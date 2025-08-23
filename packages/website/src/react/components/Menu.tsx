import { useState } from 'react';
import { MenuSize, NButton, NCard, NMenu, NMenuItem, NMenuNested } from '@nayan-ui/react';
import {
  Archive,
  ChevronDown,
  Copy,
  Download,
  Edit,
  Facebook,
  FileText,
  Folder,
  Heart,
  Image,
  Instagram,
  LogOut,
  Mail,
  MapPin,
  Minus,
  MoreVertical,
  Music,
  Phone,
  Plus,
  Settings,
  Share,
  Star,
  Trash2,
  Twitter,
  Upload,
  User,
  Video
} from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Menu = () => {
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [menuActions, setMenuActions] = useState<string[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<string[]>([]);

  const handleMenuAction = (action: string) => {
    setSelectedAction(action);
    setMenuActions(prev => [...prev, `${action} - ${new Date().toLocaleTimeString()}`]);
  };

  const toggleFavorite = (item: string) => {
    setFavoriteItems(prev => (prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]));
  };

  return (
    <ComponentWrapper>
      {/* Basic Menu */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Basic Menu</h2>
        <p className="text-muted-foreground mb-4">Simple menu with basic items and actions.</p>

        <div className="flex flex-wrap gap-4">
          <NMenu
            align="start"
            title="User Menu"
            trigger={
              <NButton className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Account</span>
              </NButton>
            }>
            <NMenuItem title="Profile" icon={User} shortcut="⌘P" onClick={() => handleMenuAction('Profile')} />
            <NMenuItem title="Settings" icon={Settings} shortcut="⌘S" onClick={() => handleMenuAction('Settings')} />
            <NMenuItem title="Logout" icon={LogOut} shortcut="⌘L" separator={true} onClick={() => handleMenuAction('Logout')} />
          </NMenu>

          <NMenu align="center" title="Actions" trigger={<NButton isOutline>Actions</NButton>}>
            <NMenuItem title="Edit" icon={Edit} shortcut="⌘E" onClick={() => handleMenuAction('Edit')} />
            <NMenuItem title="Copy" icon={Copy} shortcut="⌘C" onClick={() => handleMenuAction('Copy')} />
            <NMenuItem title="Delete" icon={Trash2} shortcut="⌘D" separator={true} onClick={() => handleMenuAction('Delete')} />
          </NMenu>
        </div>
      </div>

      {/* Menu Sizes */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Menu Sizes</h2>
        <p className="text-muted-foreground mb-4">Menus in different sizes for various contexts.</p>

        <div className="flex flex-wrap gap-4">
          <NMenu align="start" title="Small Menu" size={MenuSize.SM} trigger={<NButton className="text-sm px-3 py-1">Small Menu</NButton>}>
            <NMenuItem title="Item 1" icon={FileText} />
            <NMenuItem title="Item 2" icon={Image} />
            <NMenuItem title="Item 3" icon={Video} />
          </NMenu>

          <NMenu align="start" title="Medium Menu" size={MenuSize.MD} trigger={<NButton>Medium Menu</NButton>}>
            <NMenuItem title="Item 1" icon={FileText} shortcut="⌘1" />
            <NMenuItem title="Item 2" icon={Image} shortcut="⌘2" />
            <NMenuItem title="Item 3" icon={Video} shortcut="⌘3" />
          </NMenu>

          <NMenu align="start" title="Large Menu" size={MenuSize.LG} trigger={<NButton className="px-6 py-3">Large Menu</NButton>}>
            <NMenuItem title="Document" icon={FileText} shortcut="⌘1" />
            <NMenuItem title="Image" icon={Image} shortcut="⌘2" />
            <NMenuItem title="Video" icon={Video} shortcut="⌘3" />
            <NMenuItem title="Music" icon={Music} shortcut="⌘4" />
          </NMenu>
        </div>
      </div>

      {/* Nested Menus */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Nested Menus</h2>
        <p className="text-muted-foreground mb-4">Multi-level menus with nested submenus.</p>

        <div className="flex flex-wrap gap-4">
          <NMenu
            align="start"
            title="File Menu"
            trigger={
              <NButton className="flex items-center space-x-2">
                <Folder className="w-4 h-4" />
                <span>File</span>
              </NButton>
            }>
            <NMenuItem title="New File" icon={Plus} shortcut="⌘N" onClick={() => handleMenuAction('New File')} />
            <NMenuNested trigger={<NMenuItem title="Open Recent" icon={FileText} className="p-0" />}>
              <NMenuItem title="document.txt" icon={FileText} onClick={() => handleMenuAction('Open document.txt')} />
              <NMenuItem title="image.png" icon={Image} onClick={() => handleMenuAction('Open image.png')} />
              <NMenuItem title="video.mp4" icon={Video} onClick={() => handleMenuAction('Open video.mp4')} />
            </NMenuNested>
            <NMenuNested trigger={<NMenuItem title="Export As" icon={Download} className="p-0" />}>
              <NMenuItem title="PDF" icon={FileText} onClick={() => handleMenuAction('Export as PDF')} />
              <NMenuItem title="Image" icon={Image} onClick={() => handleMenuAction('Export as Image')} />
              <NMenuItem title="Archive" icon={Archive} onClick={() => handleMenuAction('Export as Archive')} />
            </NMenuNested>
            <NMenuItem title="Close" icon={Minus} shortcut="⌘W" separator={true} onClick={() => handleMenuAction('Close')} />
          </NMenu>

          <NMenu
            align="start"
            title="Share Menu"
            trigger={
              <NButton isOutline className="flex items-center space-x-2">
                <Share className="w-4 h-4" />
                <span>Share</span>
              </NButton>
            }>
            <NMenuNested trigger={<NMenuItem title="Social Media" icon={Share} className="p-0" />}>
              <NMenuItem title="Facebook" icon={Facebook} onClick={() => handleMenuAction('Share on Facebook')} />
              <NMenuItem title="Twitter" icon={Twitter} onClick={() => handleMenuAction('Share on Twitter')} />
              <NMenuItem title="Instagram" icon={Instagram} onClick={() => handleMenuAction('Share on Instagram')} />
            </NMenuNested>
            <NMenuNested trigger={<NMenuItem title="Contact" icon={Mail} className="p-0" />}>
              <NMenuItem title="Email" icon={Mail} shortcut="⌘E" onClick={() => handleMenuAction('Share via Email')} />
              <NMenuItem title="SMS" icon={Phone} onClick={() => handleMenuAction('Share via SMS')} />
            </NMenuNested>
            <NMenuItem title="Copy Link" icon={Copy} shortcut="⌘L" separator={true} onClick={() => handleMenuAction('Copy Link')} />
          </NMenu>
        </div>
      </div>

      {/* Menu Alignment */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Menu Alignment</h2>
        <p className="text-muted-foreground mb-4">Menus with different alignment options.</p>

        <div className="flex flex-wrap gap-4 justify-center">
          <NMenu align="start" title="Left Aligned" trigger={<NButton>Left Align</NButton>}>
            <NMenuItem title="Option 1" icon={Star} />
            <NMenuItem title="Option 2" icon={Heart} />
            <NMenuItem title="Option 3" icon={User} />
          </NMenu>

          <NMenu align="center" title="Center Aligned" trigger={<NButton>Center Align</NButton>}>
            <NMenuItem title="Option 1" icon={Star} />
            <NMenuItem title="Option 2" icon={Heart} />
            <NMenuItem title="Option 3" icon={User} />
          </NMenu>

          <NMenu align="end" title="Right Aligned" trigger={<NButton>Right Align</NButton>}>
            <NMenuItem title="Option 1" icon={Star} />
            <NMenuItem title="Option 2" icon={Heart} />
            <NMenuItem title="Option 3" icon={User} />
          </NMenu>
        </div>
      </div>

      {/* Context Menus */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Context Menus</h2>
        <p className="text-muted-foreground mb-4">Contextual menus for different scenarios and use cases.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Table Row Context Menu */}
          <NCard className="p-4">
            <h3 className="font-medium mb-3">Table Row Actions</h3>
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">John Doe</span>
              <NMenu
                align="end"
                title="Row Actions"
                trigger={
                  <NButton className="p-1">
                    <MoreVertical className="w-4 h-4" />
                  </NButton>
                }>
                <NMenuItem title="View Details" icon={User} onClick={() => handleMenuAction('View Details - John Doe')} />
                <NMenuItem title="Edit" icon={Edit} onClick={() => handleMenuAction('Edit - John Doe')} />
                <NMenuItem title="Delete" icon={Trash2} separator={true} onClick={() => handleMenuAction('Delete - John Doe')} />
              </NMenu>
            </div>
          </NCard>

          {/* File Context Menu */}
          <NCard className="p-4">
            <h3 className="font-medium mb-3">File Actions</h3>
            <div className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm">document.pdf</span>
              </div>
              <NMenu
                align="end"
                title="File Actions"
                trigger={
                  <NButton className="p-1">
                    <MoreVertical className="w-4 h-4" />
                  </NButton>
                }>
                <NMenuItem title="Download" icon={Download} shortcut="⌘D" onClick={() => handleMenuAction('Download document.pdf')} />
                <NMenuItem title="Share" icon={Share} onClick={() => handleMenuAction('Share document.pdf')} />
                <NMenuItem title="Rename" icon={Edit} onClick={() => handleMenuAction('Rename document.pdf')} />
                <NMenuItem title="Move to Trash" icon={Trash2} separator={true} onClick={() => handleMenuAction('Delete document.pdf')} />
              </NMenu>
            </div>
          </NCard>

          {/* Card Context Menu */}
          <NCard className="p-4">
            <h3 className="font-medium mb-3">Card Actions</h3>
            <div className="border rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Project Alpha</h4>
                <NMenu
                  align="end"
                  title="Project Actions"
                  trigger={
                    <NButton className="p-1">
                      <MoreVertical className="w-4 h-4" />
                    </NButton>
                  }>
                  <NMenuItem
                    title={favoriteItems.includes('Project Alpha') ? 'Remove from Favorites' : 'Add to Favorites'}
                    icon={favoriteItems.includes('Project Alpha') ? Heart : Star}
                    onClick={() => {
                      toggleFavorite('Project Alpha');
                      handleMenuAction(`${favoriteItems.includes('Project Alpha') ? 'Remove from' : 'Add to'} Favorites - Project Alpha`);
                    }}
                  />
                  <NMenuItem title="Duplicate" icon={Copy} onClick={() => handleMenuAction('Duplicate - Project Alpha')} />
                  <NMenuItem title="Archive" icon={Archive} separator={true} onClick={() => handleMenuAction('Archive - Project Alpha')} />
                </NMenu>
              </div>
              <p className="text-sm text-muted-foreground">Active project with 5 tasks</p>
            </div>
          </NCard>
        </div>
      </div>

      {/* Custom Styled Menus */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Custom Styled Menus</h2>
        <p className="text-muted-foreground mb-4">Menus with custom styling and appearances.</p>

        <div className="flex flex-wrap gap-4">
          <NMenu
            align="start"
            title="Upload Menu"
            trigger={
              <NButton className="bg-blue-500 hover:bg-blue-600 text-white flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Upload</span>
                <ChevronDown className="w-3 h-3" />
              </NButton>
            }>
            <NMenuItem title="Upload File" icon={FileText} onClick={() => handleMenuAction('Upload File')} />
            <NMenuItem title="Upload Image" icon={Image} onClick={() => handleMenuAction('Upload Image')} />
            <NMenuItem title="Upload Video" icon={Video} onClick={() => handleMenuAction('Upload Video')} />
            <NMenuItem title="Upload from URL" icon={Download} separator={true} onClick={() => handleMenuAction('Upload from URL')} />
          </NMenu>

          <NMenu
            align="start"
            title="Status Menu"
            trigger={
              <NButton className="bg-green-500 hover:bg-green-600 text-white flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Active</span>
                <ChevronDown className="w-3 h-3" />
              </NButton>
            }>
            <NMenuItem
              title="Active"
              icon={() => <div className="w-2 h-2 bg-green-500 rounded-full" />}
              onClick={() => handleMenuAction('Set Status: Active')}
            />
            <NMenuItem
              title="Inactive"
              icon={() => <div className="w-2 h-2 bg-gray-400 rounded-full" />}
              onClick={() => handleMenuAction('Set Status: Inactive')}
            />
            <NMenuItem
              title="Pending"
              icon={() => <div className="w-2 h-2 bg-yellow-500 rounded-full" />}
              onClick={() => handleMenuAction('Set Status: Pending')}
            />
            <NMenuItem
              title="Error"
              icon={() => <div className="w-2 h-2 bg-red-500 rounded-full" />}
              onClick={() => handleMenuAction('Set Status: Error')}
            />
          </NMenu>
        </div>
      </div>

      {/* Menu with Separators */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Menu with Separators</h2>
        <p className="text-muted-foreground mb-4">Organized menus using separators to group related items.</p>

        <div className="flex flex-wrap gap-4">
          <NMenu
            align="start"
            title="Editor Menu"
            trigger={
              <NButton className="flex items-center space-x-2">
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </NButton>
            }>
            <NMenuItem title="Undo" icon={Edit} shortcut="⌘Z" onClick={() => handleMenuAction('Undo')} />
            <NMenuItem title="Redo" icon={Edit} shortcut="⌘Y" separator={true} onClick={() => handleMenuAction('Redo')} />
            <NMenuItem title="Cut" icon={Copy} shortcut="⌘X" onClick={() => handleMenuAction('Cut')} />
            <NMenuItem title="Copy" icon={Copy} shortcut="⌘C" onClick={() => handleMenuAction('Copy')} />
            <NMenuItem title="Paste" icon={Copy} shortcut="⌘V" separator={true} onClick={() => handleMenuAction('Paste')} />
            <NMenuItem title="Select All" icon={Edit} shortcut="⌘A" onClick={() => handleMenuAction('Select All')} />
          </NMenu>

          <NMenu align="start" title="View Menu" trigger={<NButton isOutline>View Options</NButton>}>
            <NMenuItem title="Zoom In" icon={Plus} shortcut="⌘+" onClick={() => handleMenuAction('Zoom In')} />
            <NMenuItem title="Zoom Out" icon={Minus} shortcut="⌘-" onClick={() => handleMenuAction('Zoom Out')} />
            <NMenuItem title="Reset Zoom" icon={Edit} shortcut="⌘0" separator={true} onClick={() => handleMenuAction('Reset Zoom')} />
            <NMenuItem title="Full Screen" icon={Edit} shortcut="F11" onClick={() => handleMenuAction('Full Screen')} />
          </NMenu>
        </div>
      </div>

      {/* Interactive Menu Demo */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Interactive Menu Demo</h2>
        <p className="text-muted-foreground mb-4">Try the menus above and see the actions logged below.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NCard className="p-4">
            <h3 className="font-medium mb-3">Last Action</h3>
            <div className="p-3 bg-card rounded text-center">
              {selectedAction ? (
                <div>
                  <p className="font-medium text-blue-600">{selectedAction}</p>
                  <p className="text-xs text-muted-foreground mt-1">Action triggered</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No action selected yet</p>
              )}
            </div>
          </NCard>

          <NCard className="p-4">
            <h3 className="font-medium mb-3">Action History</h3>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {menuActions.length > 0 ? (
                menuActions
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
        </div>
      </div>

      {/* Menu Best Practices */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Menu Best Practices</h2>
        <p className="text-muted-foreground mb-4">Guidelines for effective menu design and implementation.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NCard className="p-4 border-green-200 bg-green-50 dark:bg-green-900/20">
            <h3 className="font-medium text-green-800 dark:text-green-200 mb-3">✅ Do</h3>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-2">
              <li>• Group related items together with separators</li>
              <li>• Use clear, descriptive menu item titles</li>
              <li>• Provide keyboard shortcuts for common actions</li>
              <li>• Use appropriate icons to enhance recognition</li>
              <li>• Limit nesting to 2-3 levels maximum</li>
              <li>• Consider menu alignment based on trigger position</li>
              <li>• Use consistent menu sizes within the same context</li>
            </ul>
          </NCard>

          <NCard className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
            <h3 className="font-medium text-red-800 dark:text-red-200 mb-3">❌ Don't</h3>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-2">
              <li>• Overcrowd menus with too many items</li>
              <li>• Use vague or generic menu item labels</li>
              <li>• Create deeply nested menu structures</li>
              <li>• Mix different menu sizes inconsistently</li>
              <li>• Forget to handle menu item click actions</li>
              <li>• Use menus for single-action buttons</li>
              <li>• Ignore keyboard accessibility</li>
            </ul>
          </NCard>
        </div>
      </div>

      {/* Menu State Summary */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Menu State Summary</h2>
        <p className="text-muted-foreground mb-4">Current state of interactive menu examples.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NCard className="p-4 text-center">
            <h3 className="font-medium mb-2">Total Actions</h3>
            <div className="text-2xl font-bold text-blue-600 mb-1">{menuActions.length}</div>
            <p className="text-sm text-muted-foreground">Menu interactions</p>
          </NCard>

          <NCard className="p-4 text-center">
            <h3 className="font-medium mb-2">Last Action</h3>
            <div className="text-sm font-medium mb-1 truncate">{selectedAction || 'None'}</div>
            <p className="text-sm text-muted-foreground">Most recent</p>
          </NCard>

          <NCard className="p-4 text-center">
            <h3 className="font-medium mb-2">Favorites</h3>
            <div className="text-2xl font-bold text-yellow-600 mb-1">{favoriteItems.length}</div>
            <p className="text-sm text-muted-foreground">Starred items</p>
          </NCard>
        </div>
      </div>
    </ComponentWrapper>
  );
};

export default Menu;
