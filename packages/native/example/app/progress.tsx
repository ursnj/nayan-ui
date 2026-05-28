import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NProgress, NText } from '@nayan-ui/native';
import { Stack } from 'expo-router';

export default function ProgressScreen() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setValue(v => (v >= 100 ? 0 : v + 5));
    }, 300);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: 'NProgress' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">Animated</NText>
          <NProgress value={value} />
          <NText className="text-muted">{value}%</NText>

          <NText className="text-lg font-bold">Static values</NText>
          <NProgress value={0} />
          <NProgress value={25} />
          <NProgress value={50} />
          <NProgress value={75} />
          <NProgress value={100} />
        </View>
      </ScrollView>
    </>
  );
}
