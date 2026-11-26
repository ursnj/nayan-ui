import Contributions from "@/components/contributions/Contributions";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Contributions - Open Source Contributors",
  description:
    "Contribute to Nayan UI’s engine, components, modules, or website. See local verification and pull request review steps.",
  path: "/contributions",
  keywords:
    "nayan ui contributors, open source, contribute to nayan ui, react component library contributors",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Contributions", url: `${SITE_URL}/contributions` },
  ]),
];

export default function ContributionsPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Contributions />
    </>
  );
}
