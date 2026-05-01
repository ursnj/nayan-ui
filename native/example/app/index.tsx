import { Link, Stack } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { NText, NPress, NThemeToggle } from '@nayan-ui/react-native';

const screens = [
  { href: '/accordion', label: 'NAccordion' },
  { href: '/action-item', label: 'NActionItem' },
  { href: '/alert', label: 'NAlert' },
  { href: '/avatar', label: 'NAvatar' },
  { href: '/button', label: 'NButton' },
  { href: '/button-group', label: 'NButtonGroup' },
  { href: '/card', label: 'NCard' },
  { href: '/check', label: 'NCheck' },
  { href: '/chip', label: 'NChip' },
  { href: '/confirm', label: 'NConfirm' },
  { href: '/dialog', label: 'NDialog' },
  { href: '/divider', label: 'NDivider' },
  { href: '/input', label: 'NInput' },
  { href: '/input-group', label: 'NInputGroup' },
  { href: '/input-otp', label: 'NInputOtp' },
  { href: '/link-button', label: 'NLinkButton' },
  { href: '/loading', label: 'NLoading' },
  { href: '/menu', label: 'NMenu & NMenuItem' },
  { href: '/popover', label: 'NPopover' },
  { href: '/press', label: 'NPress' },
  { href: '/progress', label: 'NProgress' },
  { href: '/radio', label: 'NRadio' },
  { href: '/select', label: 'NSelect' },
  { href: '/sheet', label: 'NSheet' },
  { href: '/skeleton', label: 'NSkeleton & NSkeletonGroup' },
  { href: '/slider', label: 'NSlider' },
  { href: '/sub-menu', label: 'NSubMenu' },
  { href: '/switch', label: 'NSwitch' },
  { href: '/tabs', label: 'NTabs' },
  { href: '/tag-group', label: 'NTagGroup' },
  { href: '/text', label: 'NText' },
  { href: '/theme', label: 'NTheme & NThemeToggle' },
  { href: '/toast', label: 'NToast (useNToast)' },
  { href: '/tooltip', label: 'NTooltip' },
] as const;

export default function Index() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Nayan UI',
          headerRight: () => <NThemeToggle className="px-3" />,
        }}
      />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-2">
        {screens.map((s) => (
          <Link key={s.href} href={s.href} asChild>
            <NPress className="p-4 bg-surface rounded-lg">
              <NText className="text-lg font-medium">{s.label}</NText>
            </NPress>
          </Link>
        ))}
        </View>
      </ScrollView>
    </>
  );
}
