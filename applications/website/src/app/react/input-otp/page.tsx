import JsonLd from "@/components/helpers/JsonLd";
import InputOTP from "@/components/react/components/InputOTP";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/input-otp", "react");
export const metadata = pageMetadata;

export default function InputOTPPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <InputOTP />
    </>
  );
}
