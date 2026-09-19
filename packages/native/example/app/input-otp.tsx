import { useState } from "react";
import { NInputOtp, NText } from "@nayan-ui/native";
import Screen from "../src/components/Screen";

export default function InputOtpScreen() {
  const [otp4, setOtp4] = useState("");
  const [otp6, setOtp6] = useState("");

  return (
    <Screen title="NInputOtp" keyboardAware>
      <NText className="text-lg font-bold">4 digits</NText>
      <NInputOtp maxLength={4} value={otp4} onChange={setOtp4} />
      <NText>Value: {otp4 || "—"}</NText>

      <NText className="text-lg font-bold">6 digits</NText>
      <NInputOtp maxLength={6} value={otp6} onChange={setOtp6} />

      <NText className="text-lg font-bold">Secondary variant</NText>
      <NInputOtp maxLength={4} slotVariant="secondary" value="" onChange={() => {}} />
    </Screen>
  );
}
