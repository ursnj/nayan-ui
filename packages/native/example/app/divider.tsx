import { View } from 'react-native';
import { NDivider, NText } from '@nayan-ui/native';
import Screen from '../src/components/Screen';

export default function DividerScreen() {
  return (
    <Screen title="NDivider">
      <NText className="text-lg font-bold">Horizontal (default)</NText>
      <NText>Above</NText>
      <NDivider />
      <NText>Below</NText>

      <NText className="text-lg font-bold">Vertical</NText>
      <View className="flex-row items-center gap-3 h-10">
        <NText>Left</NText>
        <NDivider orientation="vertical" />
        <NText>Right</NText>
      </View>

      <NText className="text-lg font-bold">Custom thickness</NText>
      <NDivider thickness={3} />
    </Screen>
  );
}
