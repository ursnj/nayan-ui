import JsonLd from "@/helpers/JsonLd";
import InputOTP from "@/react/components/InputOTP";
import { buildComponentPageSeo } from "@/services/seoHelpers";

export const dynamic = "force-dynamic";

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
