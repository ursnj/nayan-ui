import { NAlert, NText } from "@nayan-ui/native";
import Screen from "../src/components/Screen";

export default function AlertScreen() {
  return (
    <Screen title="NAlert" gap={3}>
      <NText className="text-lg font-bold">Default</NText>
      <NAlert title="Heads up!" description="This is a default alert." />

      <NText className="text-lg font-bold">Accent</NText>
      <NAlert status="accent" title="New update" description="A new version is available." />

      <NText className="text-lg font-bold">Success</NText>
      <NAlert status="success" title="Saved" description="Your changes have been saved." />

      <NText className="text-lg font-bold">Warning</NText>
      <NAlert status="warning" title="Warning" description="Your session is about to expire." />

      <NText className="text-lg font-bold">Danger</NText>
      <NAlert status="danger" title="Error" description="Something went wrong." />

      <NText className="text-lg font-bold">Title only</NText>
      <NAlert title="Simple alert without description" />

      <NText className="text-lg font-bold">Long description</NText>
      <NAlert
        status="accent"
        title="Important"
        description="This is a much longer description that wraps across multiple lines to show how the alert handles longer content gracefully."
      />

      <NText className="text-lg font-bold">With close button</NText>
      <NAlert
        status="accent"
        title="Dismissible"
        description="Tap the close button to dismiss."
        onClose={() => console.log("closed")}
      />
      <NAlert
        status="success"
        title="Upload complete"
        description="Your file has been uploaded."
        onClose={() => console.log("closed")}
      />
      <NAlert
        status="warning"
        title="Low storage"
        description="You are running low on storage."
        onClose={() => console.log("closed")}
      />
    </Screen>
  );
}
