'use client';

import ComponentWrapper from '@/helpers/ComponentWrapper';
import DemoComingSoon from './DemoComingSoon';

const Dialog = () => {
  return (
    <ComponentWrapper code={code}>
      <DemoComingSoon componentName="Dialog" />
    </ComponentWrapper>
  );
};

export default Dialog;

export const code = `import { useState } from 'react';
import { View } from 'react-native';
import { NButton, NDialog, NText } from '@nayan-ui/native';

export default function DialogScreen() {
  const [open, setOpen] = useState(false);

  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Trigger-based</NText>
      <NDialog title="Welcome" trigger={<NButton>Open Dialog</NButton>}>
        <View className="">
          <NText>This dialog opened from a trigger button.</NText>
        </View>
      </NDialog>

      <NText className="text-lg font-bold">Controlled</NText>
      <NButton onPress={() => setOpen(true)}>Open Controlled</NButton>
      <NDialog title="Controlled Dialog" isOpen={open} onOpenChange={setOpen}>
        <View className="">
          <NText>Controlled via isOpen / onOpenChange.</NText>
          <NButton className="mt-3" variant="outline" onPress={() => setOpen(false)}>
            Close
          </NButton>
        </View>
      </NDialog>

      <NText className="text-lg font-bold">With description</NText>
      <NDialog title="Terms" description="Please read carefully." trigger={<NButton variant="outline">Terms</NButton>}>
        <View className="">
          <NText>By using this app you agree to our terms of service and privacy policy.</NText>
        </View>
      </NDialog>
    </View>
  );
}`;
