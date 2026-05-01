import { useCallback } from 'react';
import { Link, Stack } from 'expo-router';
import { FlatList } from 'react-native';
import { NText, NPress, NThemeToggle } from '@nayan-ui/react-native';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface ScreenItem {
  href: string;
  label: string;
  description: string;
  icon: IoniconsName;
}

const screens: ScreenItem[] = [
  { href: '/accordion', label: 'Accordion', description: 'Expandable content sections', icon: 'chevron-down-circle-outline' },
  { href: '/action-item', label: 'Action Item', description: 'Pressable list actions', icon: 'hand-left-outline' },
  { href: '/alert', label: 'Alert', description: 'Status alert banners', icon: 'alert-circle-outline' },
  { href: '/avatar', label: 'Avatar', description: 'User profile images', icon: 'person-circle-outline' },
  { href: '/button', label: 'Button', description: 'Pressable action buttons', icon: 'radio-button-on-outline' },
  { href: '/button-group', label: 'Button Group', description: 'Segmented button controls', icon: 'apps-outline' },
  { href: '/card', label: 'Card', description: 'Content container cards', icon: 'card-outline' },
  { href: '/check', label: 'Check', description: 'Checkbox with label', icon: 'checkbox-outline' },
  { href: '/chip', label: 'Chip', description: 'Compact info badges', icon: 'pricetag-outline' },
  { href: '/confirm', label: 'Confirm', description: 'Confirmation dialogs', icon: 'help-circle-outline' },
  { href: '/dialog', label: 'Dialog', description: 'Modal dialog overlays', icon: 'chatbox-outline' },
  { href: '/divider', label: 'Divider', description: 'Content separators', icon: 'remove-outline' },
  { href: '/input', label: 'Input', description: 'Text input fields', icon: 'create-outline' },
  { href: '/input-group', label: 'Input Group', description: 'Input with prefix/suffix', icon: 'at-outline' },
  { href: '/input-otp', label: 'Input OTP', description: 'One-time password input', icon: 'keypad-outline' },
  { href: '/link-button', label: 'Link Button', description: 'Ghost-style link buttons', icon: 'link-outline' },
  { href: '/loading', label: 'Loading', description: 'Loading spinners', icon: 'sync-outline' },
  { href: '/menu', label: 'Menu', description: 'Dropdown menu actions', icon: 'menu-outline' },
  { href: '/popover', label: 'Popover', description: 'Floating popover content', icon: 'chatbubble-outline' },
  { href: '/press', label: 'Press', description: 'Pressable touch wrapper', icon: 'finger-print-outline' },
  { href: '/progress', label: 'Progress', description: 'Progress bar indicator', icon: 'bar-chart-outline' },
  { href: '/radio', label: 'Radio', description: 'Radio group selection', icon: 'radio-button-off-outline' },
  { href: '/select', label: 'Select', description: 'Dropdown select picker', icon: 'caret-down-outline' },
  { href: '/sheet', label: 'Sheet', description: 'Bottom sheet overlays', icon: 'layers-outline' },
  { href: '/skeleton', label: 'Skeleton', description: 'Loading placeholders', icon: 'square-outline' },
  { href: '/slider', label: 'Slider', description: 'Range slider control', icon: 'options-outline' },
  { href: '/sub-menu', label: 'Sub Menu', description: 'Nested menu items', icon: 'git-branch-outline' },
  { href: '/switch', label: 'Switch', description: 'Toggle switch control', icon: 'toggle-outline' },
  { href: '/tabs', label: 'Tabs', description: 'Tabbed content views', icon: 'albums-outline' },
  { href: '/tag-group', label: 'Tag Group', description: 'Selectable tag chips', icon: 'pricetags-outline' },
  { href: '/text', label: 'Text', description: 'Styled text component', icon: 'text-outline' },
  { href: '/theme', label: 'Theme', description: 'Theme toggle controls', icon: 'color-palette-outline' },
  { href: '/toast', label: 'Toast', description: 'Toast notifications', icon: 'notifications-outline' },
  { href: '/tooltip', label: 'Tooltip', description: 'Hover/press tooltips', icon: 'information-circle-outline' },
];

export default function Index() {
  const renderItem = useCallback(({ item }: { item: ScreenItem }) => (
    <Link href={item.href as any} asChild>
      <NPress className="flex-1 m-1.5 p-3 bg-surface rounded-xl items-center">
        <Ionicons name={item.icon} size={28} color="#a1a1aa" />
        <NText className="text-sm font-semibold mt-2 text-center" numberOfLines={1}>{item.label}</NText>
        <NText className="text-xs text-muted text-center mt-0.5" numberOfLines={2}>{item.description}</NText>
      </NPress>
    </Link>
  ), []);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Nayan UI',
          headerRight: () => <NThemeToggle className="px-3" />,
        }}
      />
      <FlatList
        data={screens}
        renderItem={renderItem}
        keyExtractor={(item) => item.href}
        numColumns={2}
        contentContainerClassName="p-2 bg-background"
        className="flex-1 bg-background"
      />
    </>
  );
}
