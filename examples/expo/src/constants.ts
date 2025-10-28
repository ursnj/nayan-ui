import { DarkTheme, DefaultTheme } from '@react-navigation/native';

export const themeColors = {
  light: {
    ...DefaultTheme,
    colors: {
      primary: 'hsl(215 100% 45%)',
      background: 'hsl(216 20% 95%)',
      card: 'hsl(0 0% 100%)',
      text: 'hsl(0 0% 2%)',
      muted: 'hsl(0 0% 50%)',
      border: 'hsl(0 0% 88%)',
      notification: 'hsl(0 0% 100%)'
    }
  },
  dark: {
    ...DarkTheme,
    colors: {
      primary: 'hsl(209 100% 58%)',
      background: 'hsl(0 0% 12%)',
      card: 'hsl(0 0% 21%)',
      text: 'hsl(0 0% 96%)',
      muted: 'hsl(0 0% 69%)',
      border: 'hsl(0 0% 31%)',
      notification: 'hsl(0 0% 21%)'
    }
  }
};

export const components = [
  {
    name: 'accordion',
    title: 'Accordion',
    icon: 'ChevronDown',
    description: 'Collapsible content sections with expand/collapse functionality'
  },
  {
    name: 'action-item',
    title: 'Action Item',
    icon: 'MousePointer',
    description: 'Interactive list items with icons and press actions'
  },
  {
    name: 'alert',
    title: 'Alert',
    icon: 'AlertCircle',
    description: 'Contextual feedback messages for user notifications'
  },
  {
    name: 'button',
    title: 'Button',
    icon: 'Square',
    description: 'Interactive buttons with various styles and states'
  },
  {
    name: 'button-group',
    title: 'Button Group',
    icon: 'MoreHorizontal',
    description: 'Grouped buttons for related actions and selections'
  },
  {
    name: 'card',
    title: 'Card',
    icon: 'CreditCard',
    description: 'Container component for grouping related content'
  },
  {
    name: 'checkbox',
    title: 'Checkbox',
    icon: 'CheckSquare',
    description: 'Binary selection input for forms and lists'
  },
  {
    name: 'color-picker',
    title: 'Color Picker',
    icon: 'Palette',
    description: 'Color selection interface with predefined options'
  },
  {
    name: 'confirm',
    title: 'Confirm',
    icon: 'HelpCircle',
    description: 'Confirmation dialogs for important user actions'
  },
  {
    name: 'date-picker',
    title: 'Date Picker',
    icon: 'Calendar',
    description: 'Date and time selection with modal interface'
  },
  {
    name: 'dialog',
    title: 'Dialog',
    icon: 'MessageSquare',
    description: 'Modal dialogs for forms and important information'
  },
  {
    name: 'divider',
    title: 'Divider',
    icon: 'Minus',
    description: 'Visual separators for organizing content sections'
  },
  {
    name: 'input',
    title: 'Input',
    icon: 'Edit3',
    description: 'Text input fields with validation and styling'
  },
  {
    name: 'linkify',
    title: 'Linkify',
    icon: 'Link',
    description: 'Automatic URL detection and link conversion in text'
  },
  {
    name: 'loader',
    title: 'Loader',
    icon: 'Loader2',
    description: 'Loading indicators and progress animations'
  },
  {
    name: 'menu',
    title: 'Menu',
    icon: 'Menu',
    description: 'Dropdown menus with actions and navigation items'
  },
  {
    name: 'popover',
    title: 'Popover',
    icon: 'MessageCircle',
    description: 'Contextual overlays triggered by user interactions'
  },
  {
    name: 'pressable',
    title: 'Pressable',
    icon: 'Hand',
    description: 'Touchable components with press feedback and events'
  },
  {
    name: 'progress',
    title: 'Progress',
    icon: 'BarChart3',
    description: 'Progress bars and completion indicators'
  },
  {
    name: 'radio',
    title: 'Radio',
    icon: 'Circle',
    description: 'Single selection input for mutually exclusive options'
  },
  {
    name: 'select',
    title: 'Select',
    icon: 'ChevronDown',
    description: 'Dropdown selection with single and multiple options'
  },
  {
    name: 'sheet',
    title: 'Sheet',
    icon: 'PanelBottom',
    description: 'Bottom sheet modals with drag interactions'
  },
  {
    name: 'skeleton',
    title: 'Skeleton',
    icon: 'Zap',
    description: 'Loading placeholders that mimic content structure'
  },
  {
    name: 'switch',
    title: 'Switch',
    icon: 'ToggleLeft',
    description: 'Toggle switches for binary settings and preferences'
  },
  {
    name: 'text',
    title: 'Text',
    icon: 'Type',
    description: 'Styled text components with typography options'
  },
  {
    name: 'textarea',
    title: 'Textarea',
    icon: 'FileText',
    description: 'Multi-line text input for longer content'
  },
  {
    name: 'toast',
    title: 'Toast',
    icon: 'Bell',
    description: 'Temporary notification messages and alerts'
  },
  {
    name: 'tooltip',
    title: 'Tooltip',
    icon: 'Info',
    description: 'Contextual help text displayed on hover or press'
  }
];
