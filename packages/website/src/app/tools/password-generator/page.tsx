import PasswordGeneratorPage from "@/components/tools/dev-tools/PasswordGeneratorPage";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Password Generator",
  description:
    "Generate strong, cryptographically secure passwords with customizable length and character sets. Free online password generator by Nayan UI.",
  path: "/tools/password-generator",
  keywords:
    "password generator, secure password generator, random password generator, strong password generator, crypto password, password strength, free password generator, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Password Generator", url: `${SITE_URL}/tools/password-generator` },
  ]),
  buildTechArticleSchema({
    title: "Password Generator",
    description: "Generate strong, cryptographically secure passwords with customizable length and character sets.",
    url: `${SITE_URL}/tools/password-generator`,
    keywords: "password generator, secure password, random password, password strength",
  }),
];

export default function PasswordGeneratorRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <PasswordGeneratorPage />
    </>
  );
}
