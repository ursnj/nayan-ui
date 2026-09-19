'use client';

import ComponentWrapper from '@/helpers/ComponentWrapper';
import DemoComingSoon from './DemoComingSoon';

const Slider = () => {
  return (
    <ComponentWrapper code={code}>
      <DemoComingSoon componentName="Slider" />
    </ComponentWrapper>
  );
};

export default Slider;

export const code = `import { View } from 'react-native';
import { NSlider, NText } from '@nayan-ui/native';

export default function SliderScreen() {
  return (
    <View className="p-4 gap-4">
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
    </View>
  );
}`;

export const sliderAttributes = [
  { name: 'value', type: 'number', default: 'Optional', details: 'Controlled slider value.' },
  { name: 'defaultValue', type: 'number', default: 'Optional', details: 'Default slider value.' },
  { name: 'onChange', type: '(value: number) => void', default: 'Optional', details: 'Callback when slider value changes.' },
  { name: 'minValue', type: 'number', default: '0', details: 'Minimum value of the slider.' },
  { name: 'maxValue', type: 'number', default: '100', details: 'Maximum value of the slider.' },
  { name: 'step', type: 'number', default: '1', details: 'Step increment of the slider.' },
  { name: 'isDisabled', type: 'boolean', default: 'false', details: 'Whether the slider is disabled.' },
  { name: 'showOutput', type: 'boolean', default: 'false', details: 'Whether to show the current value output.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'trackClassName', type: 'string', default: "' '", details: 'You can customise track by passing tailwind classes.' },
  { name: 'fillClassName', type: 'string', default: "' '", details: 'You can customise fill by passing tailwind classes.' },
  { name: 'thumbClassName', type: 'string', default: "' '", details: 'You can customise thumb by passing tailwind classes.' }
];
