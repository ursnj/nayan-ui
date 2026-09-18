import { NSlider, NText } from '@nayan-ui/native';
import Screen from '../src/components/Screen';

export default function SliderScreen() {
  return (
    <Screen title="NSlider">
      <NText className="text-lg font-bold">Basic</NText>
      <NSlider defaultValue={50} />

      <NText className="text-lg font-bold">With output label</NText>
      <NSlider defaultValue={30} showOutput />

      <NText className="text-lg font-bold">Custom range (0–200)</NText>
      <NSlider defaultValue={100} minValue={0} maxValue={200} showOutput />

      <NText className="text-lg font-bold">Step = 10</NText>
      <NSlider defaultValue={50} step={10} showOutput />

      <NText className="text-lg font-bold">Disabled</NText>
      <NSlider defaultValue={40} isDisabled />
    </Screen>
  );
}
