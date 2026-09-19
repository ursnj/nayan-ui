"use client";

import ComponentWrapper from "@/helpers/ComponentWrapper";
import DemoComingSoon from "./DemoComingSoon";

const Sheet = () => {
  return (
    <ComponentWrapper code={code} attributes={sheetAttributes}>
      <DemoComingSoon componentName="Sheet" />
    </ComponentWrapper>
  );
};

export default Sheet;

export const code = `import { useState } from 'react';
import { View } from 'react-native';
import { NButton, NSheet, NText } from '@nayan-ui/native';

export default function SheetScreen() {
  const [basic, setBasic] = useState(false);
  const [content, setContent] = useState(false);

  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Basic</NText>
      <NButton onPress={() => setBasic(true)}>Open Sheet</NButton>
      <NSheet isOpen={basic} onOpenChange={setBasic}>
        <View className="p-4">
          <NText className="text-lg font-bold mb-2">Bottom Sheet</NText>
          <NText>Simple sheet content.</NText>
          <NButton className="mt-4" variant="outline" onPress={() => setBasic(false)}>
            Close
          </NButton>
        </View>
      </NSheet>

      <NText className="text-lg font-bold">Rich content</NText>
      <NButton variant="outline" onPress={() => setContent(true)}>
        Open Rich Sheet
      </NButton>
      <NSheet isOpen={content} onOpenChange={setContent}>
        <View className="p-4 gap-3">
          <NText className="text-xl font-bold">Settings</NText>
          <NText className="text-muted">Adjust your preferences below.</NText>
          <NButton onPress={() => setContent(false)}>Save</NButton>
          <NButton variant="ghost" onPress={() => setContent(false)}>
            Cancel
          </NButton>
        </View>
      </NSheet>
    </View>
  );
}`;

export const sheetAttributes = [
  {
    name: "children",
    type: "React.ReactNode",
    default: "Required",
    details: "Content for the sheet.",
  },
  {
    name: "trigger",
    type: "React.ReactNode",
    default: "Optional",
    details: "Trigger element to open the sheet.",
  },
  {
    name: "title",
    type: "string",
    default: "Optional",
    details: "Title shown at the top of the sheet.",
  },
  {
    name: "description",
    type: "string",
    default: "Optional",
    details: "Description text below the title.",
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
    name: "className",
    type: "string",
    default: "' '",
    details: "You can customise content by passing tailwind classes.",
  },
  {
    name: "titleClassName",
    type: "string",
    default: "' '",
    details: "You can customise title by passing tailwind classes.",
  },
  {
    name: "descriptionClassName",
    type: "string",
    default: "' '",
    details: "You can customise description by passing tailwind classes.",
  },
  {
    name: "snapPoints",
    type: "(string | number)[]",
    default: "Optional",
    details: "Array of snap points for the bottom sheet.",
  },
];
