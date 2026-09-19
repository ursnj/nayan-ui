"use client";

import ComponentWrapper from "@/helpers/ComponentWrapper";
import DemoComingSoon from "./DemoComingSoon";

const Dialog = () => {
  return (
    <ComponentWrapper code={code} attributes={dialogAttributes}>
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

export const dialogAttributes = [
  { name: "title", type: "string", default: "Required", details: "Title for the dialog." },
  {
    name: "description",
    type: "string",
    default: "Optional",
    details: "Description text below the title.",
  },
  {
    name: "children",
    type: "React.ReactNode",
    default: "Optional",
    details: "Content for the dialog body.",
  },
  {
    name: "trigger",
    type: "React.ReactNode",
    default: "Optional",
    details: "Trigger element for the dialog.",
  },
  { name: "isOpen", type: "boolean", default: "Optional", details: "Controlled open state." },
  {
    name: "isDefaultOpen",
    type: "boolean",
    default: "Optional",
    details: "Default open state for uncontrolled usage.",
  },
  {
    name: "onOpenChange",
    type: "(isOpen: boolean) => void",
    default: "Optional",
    details: "Callback when open state changes.",
  },
  {
    name: "isSwipeable",
    type: "boolean",
    default: "Optional",
    details: "Whether the dialog can be swiped to dismiss.",
  },
  {
    name: "className",
    type: "string",
    default: "' '",
    details: "You can customise by passing tailwind classes.",
  },
  {
    name: "titleClassName",
    type: "string",
    default: "' '",
    details: "You can customise title by passing tailwind classes.",
  },
  {
    name: "contentClassName",
    type: "string",
    default: "' '",
    details: "You can customise content by passing tailwind classes.",
  },
  {
    name: "descriptionClassName",
    type: "string",
    default: "' '",
    details: "Custom class for the dialog description.",
  },
];
