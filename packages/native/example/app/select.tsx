import { useState } from "react";
import { NSelect, NText } from "@nayan-ui/native";
import Screen from "../src/components/Screen";

export default function SelectScreen() {
  const [country, setCountry] = useState("");

  return (
    <Screen title="NSelect">
      <NText className="text-lg font-bold">Basic</NText>
      <NSelect
        label="Country"
        placeholder="Select a country"
        items={[
          { label: "India", value: "in" },
          { label: "USA", value: "us" },
          { label: "UK", value: "uk" },
          { label: "Germany", value: "de" },
          { label: "Japan", value: "jp" },
        ]}
        onValueChange={setCountry}
      />
      <NText>Selected: {country || "—"}</NText>

      <NText className="text-lg font-bold">With default value</NText>
      <NSelect
        label="Language"
        defaultValue={{ label: "English", value: "en" }}
        items={[
          { label: "English", value: "en" },
          { label: "Spanish", value: "es" },
          { label: "French", value: "fr" },
        ]}
        onValueChange={() => {}}
      />

      <NText className="text-lg font-bold">Disabled</NText>
      <NSelect
        label="Locked"
        isDisabled
        items={[{ label: "Only option", value: "only" }]}
        onValueChange={() => {}}
      />
    </Screen>
  );
}
