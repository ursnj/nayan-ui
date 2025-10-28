import { ScrollView, View } from 'react-native';
import { NActionItem, NPress, NText, NThemeToggle, THEMES, useNTheme } from '@nayan-ui/react-native';
import { Stack, useRouter } from 'expo-router';
import * as Icons from 'lucide-react-native';
import { components } from '../constants';

export default function Home() {
  const router = useRouter();
  const { isDarkMode, setTheme } = useNTheme();

  const changeTheme = () => {
    setTheme(isDarkMode ? THEMES.light : THEMES.dark);
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent size={24} color={isDarkMode ? '#60a5fa' : '#3b82f6'} /> : undefined;
  };

  return (
    <ScrollView className="flex-1 bg-background p-1.5 pb-10">
      <Stack.Screen
        options={{
          headerRight: () => (
            <NPress onPress={changeTheme} className="p-3">
              <NThemeToggle onThemeChange={() => undefined} />
            </NPress>
          )
        }}
      />

      {/* Header */}
      <View className="mb-6 mt-2">
        <NText className="text-3xl font-bold text-text mb-2">Nayan UI</NText>
        <NText className="text-lg text-muted">React Native Component Library</NText>
        <NText className="text-sm text-muted mt-1">Explore {components.length} beautifully crafted components</NText>
      </View>

      {/* Component List */}
      <View className="gap-2">
        {components.map((component: any) => (
          <NActionItem
            key={component.name}
            name={component.title}
            description={component.description}
            icon={getIcon(component.icon)}
            onPress={() => router.navigate({ pathname: component.name })}
            className="bg-card border border-border rounded-lg mb-1"
            titleClassName="text-lg font-semibold text-text"
            descriptionClassName="text-sm text-muted leading-5 mt-1"
          />
        ))}
      </View>

      {/* Footer */}
      <View className="mt-8 mb-12">
        <NText className="text-center text-base text-muted">Built with ❤️ using Nayan UI</NText>
      </View>
    </ScrollView>
  );
}
