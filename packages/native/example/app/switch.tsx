import { useState } from "react";
import { NSwitch, NText } from "@nayan-ui/native";
import Screen from "../src/components/Screen";

export default function SwitchScreen() {
  const [wifi, setWifi] = useState(true);
  const [bluetooth, setBluetooth] = useState(false);

  return (
    <Screen title="NSwitch">
      <NText className="text-lg font-bold">Basic</NText>
      <NSwitch label="Wi-Fi" isSelected={wifi} onSelectedChange={setWifi} />
      <NSwitch label="Bluetooth" isSelected={bluetooth} onSelectedChange={setBluetooth} />
      <NText className="text-muted">
        Wi-Fi: {wifi ? "On" : "Off"}, Bluetooth: {bluetooth ? "On" : "Off"}
      </NText>

      <NText className="text-lg font-bold">Disabled</NText>
      <NSwitch label="Disabled on" isSelected isDisabled onSelectedChange={() => {}} />
      <NSwitch label="Disabled off" isSelected={false} isDisabled onSelectedChange={() => {}} />
    </Screen>
  );
}
