import { useState } from "react";
import { NButton, NConfirm, NText } from "@nayan-ui/native";
import Screen from "../src/components/Screen";

export default function ConfirmScreen() {
  const [result, setResult] = useState<string>("—");

  return (
    <Screen title="NConfirm">
      <NText className="text-lg font-bold">Basic confirm</NText>
      <NConfirm
        title="Delete item?"
        description="This action cannot be undone."
        onResult={(ok) => setResult(ok ? "Confirmed" : "Cancelled")}
      >
        <NButton variant="danger">Delete</NButton>
      </NConfirm>
      <NText>Result: {result}</NText>

      <NText className="text-lg font-bold">Custom button text</NText>
      <NConfirm
        title="Discard changes?"
        description="You have unsaved changes."
        confirmText="Discard"
        cancelText="Keep editing"
        onResult={(ok) => setResult(ok ? "Discarded" : "Kept")}
      >
        <NButton variant="outline">Discard</NButton>
      </NConfirm>
    </Screen>
  );
}
