import { Link } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { NText, NPress } from '@nayan-ui/react-native';

const screens = [
  { href: '/buttons', label: 'Buttons' },
  { href: '/inputs', label: 'Inputs' },
  { href: '/selections', label: 'Selections' },
  { href: '/feedback', label: 'Feedback' },
  { href: '/overlays', label: 'Overlays' },
  { href: '/layout-components', label: 'Layout' },
  { href: '/data', label: 'Data Display' },
  { href: '/navigation', label: 'Navigation' },
] as const;

export default function Index() {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4 gap-2">
        <NText className="text-2xl font-bold mb-4">Components</NText>
        {screens.map((s) => (
          <Link key={s.href} href={s.href} asChild>
            <NPress className="p-4 bg-surface rounded-lg">
              <NText className="text-lg font-medium">{s.label}</NText>
            </NPress>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}
