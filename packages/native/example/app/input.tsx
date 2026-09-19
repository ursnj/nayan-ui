import { NInput, NText } from "@nayan-ui/native";
import Screen from "../src/components/Screen";

export default function InputScreen() {
  return (
    <Screen title="NInput" gap={1} keyboardAware>
      <NText className="text-lg font-bold">Basic</NText>
      <NInput label="Name" />

      <NText className="text-lg font-bold">With description</NText>
      <NInput label="Email" description="We'll never share your email." />

      <NText className="text-lg font-bold">Required</NText>
      <NInput label="Username" isRequired />

      <NText className="text-lg font-bold">Invalid with error</NText>
      <NInput label="Password" isInvalid errorMessage="Password must be at least 8 characters." />

      <NText className="text-lg font-bold">Disabled</NText>
      <NInput label="Organization" isDisabled />

      <NText className="text-lg font-bold">Multiline (textarea)</NText>
      <NInput label="Bio" multiline description="Tell us about yourself." />

      <NText className="text-lg font-bold">All combined</NText>
      <NInput
        label="Phone"
        description="Include country code."
        isRequired
        isInvalid
        errorMessage="Invalid phone number."
      />
    </Screen>
  );
}
