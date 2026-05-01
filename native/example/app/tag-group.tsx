import { ScrollView, View } from 'react-native';
import { NTagGroup, NText } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function TagGroupScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'NTagGroup' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">Single selection</NText>
          <NTagGroup
            selectionMode="single"
            items={[
              { label: 'React', value: 'react' },
              { label: 'Vue', value: 'vue' },
              { label: 'Angular', value: 'angular' },
              { label: 'Svelte', value: 'svelte' },
            ]}
          />

          <NText className="text-lg font-bold">Multiple selection</NText>
          <NTagGroup
            selectionMode="multiple"
            items={[
              { label: 'TypeScript', value: 'ts' },
              { label: 'JavaScript', value: 'js' },
              { label: 'Python', value: 'py' },
              { label: 'Rust', value: 'rs' },
            ]}
          />

          <NText className="text-lg font-bold">Sizes</NText>
          <NText className="text-muted">Small</NText>
          <NTagGroup
            size="sm"
            items={[
              { label: 'Tag A', value: 'a' },
              { label: 'Tag B', value: 'b' },
            ]}
          />
          <NText className="text-muted">Large</NText>
          <NTagGroup
            size="lg"
            items={[
              { label: 'Tag A', value: 'a' },
              { label: 'Tag B', value: 'b' },
            ]}
          />

          <NText className="text-lg font-bold">Surface variant</NText>
          <NTagGroup
            variant="surface"
            items={[
              { label: 'One', value: '1' },
              { label: 'Two', value: '2' },
              { label: 'Three', value: '3' },
            ]}
          />

          <NText className="text-lg font-bold">With disabled item</NText>
          <NTagGroup
            items={[
              { label: 'Enabled', value: 'e' },
              { label: 'Disabled', value: 'd', isDisabled: true },
            ]}
          />
        </View>
      </ScrollView>
    </>
  );
}
