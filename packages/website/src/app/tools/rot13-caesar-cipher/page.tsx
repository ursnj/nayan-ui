import Rot13CaesarCipherPage from "@/components/tools/text-tools/Rot13CaesarCipherPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "ROT13 / Caesar Cipher",
  description:
    "Encode or decode text with a classic Caesar cipher, including ROT13. Choose any shift from 1 to 25. Free online Caesar cipher tool by Nayan UI.",
  path: "/tools/rot13-caesar-cipher",
  keywords:
    "rot13, caesar cipher, rot13 converter, caesar cipher encoder, caesar cipher decoder, text shift cipher, letter shift encoder, classical cipher tool, encode decode text, free rot13 tool, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "ROT13 / Caesar Cipher", url: `${SITE_URL}/tools/rot13-caesar-cipher` },
  ]),
  buildTechArticleSchema({
    title: "ROT13 / Caesar Cipher",
    description: "Encode or decode text with a classic Caesar cipher, including ROT13.",
    url: `${SITE_URL}/tools/rot13-caesar-cipher`,
    keywords: "rot13, caesar cipher, encoder, decoder, letter shift",
  }),
];

export default function Rot13CaesarCipherRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <Rot13CaesarCipherPage />
    </>
  );
}
