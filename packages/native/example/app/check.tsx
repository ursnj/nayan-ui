import { useState } from "react";
import { NCheck, NText } from "@nayan-ui/native";
import Screen from "../src/components/Screen";

export default function CheckScreen() {
  const [a, setA] = useState(false);
  const [b, setB] = useState(true);

  return (
    <Screen title="NCheck">
      <NText className="text-lg font-bold">Basic</NText>
      <NCheck label="Accept terms and conditions" isSelected={a} onSelectedChange={setA} />
      <NText>Checked: {a ? "Yes" : "No"}</NText>

      <NText className="text-lg font-bold">Pre-checked</NText>
      <NCheck label="Receive newsletters" isSelected={b} onSelectedChange={setB} />

      <NText className="text-lg font-bold">Disabled</NText>
      <NCheck
        label="Disabled unchecked"
        isSelected={false}
        isDisabled
        onSelectedChange={() => {}}
      />
      <NCheck label="Disabled checked" isSelected isDisabled onSelectedChange={() => {}} />
    </Screen>
  );
}
