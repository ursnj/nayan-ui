import JwtDecoderPage from "@/components/tools/dev-tools/JwtDecoderPage";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "JWT Decoder",
  description: "Decode and inspect JSON Web Tokens (JWT). Free online JWT decoder by Nayan UI.",
  path: "/tools/jwt-decoder",
  keywords: "jwt decoder, jwt parser, json web token decoder, jwt inspector, jwt token viewer, online jwt decoder, free jwt decoder, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "JWT Decoder", url: `${SITE_URL}/tools/jwt-decoder` },
  ]),
  buildTechArticleSchema({
    title: "JWT Decoder",
    description: "Decode and inspect JSON Web Tokens (JWT).",
    url: `${SITE_URL}/tools/jwt-decoder`,
    keywords: "jwt decoder, jwt parser, json web token, jwt inspector",
  }),
];

export default function JwtDecoderRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <JwtDecoderPage />
    </>
  );
}
