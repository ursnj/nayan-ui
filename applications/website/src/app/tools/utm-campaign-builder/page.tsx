import UtmCampaignBuilderPage from "@/components/tools/seo-tools/UtmCampaignBuilderPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "UTM Campaign URL Builder",
  description:
    "Build correctly-encoded UTM campaign tracking URLs for Google Analytics with source, medium, campaign, term, and content parameters. Free online UTM builder by Nayan UI.",
  path: "/tools/utm-campaign-builder",
  keywords:
    "utm campaign builder, utm url builder, campaign url builder, google analytics utm, utm source medium campaign, utm link generator, url tagging tool, marketing campaign url, free utm builder, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "UTM Campaign URL Builder", url: `${SITE_URL}/tools/utm-campaign-builder` },
  ]),
  buildTechArticleSchema({
    title: "UTM Campaign URL Builder",
    description: "Build correctly-encoded UTM campaign tracking URLs for Google Analytics.",
    url: `${SITE_URL}/tools/utm-campaign-builder`,
    keywords: "utm campaign builder, utm url builder, google analytics utm, utm link generator",
  }),
];

export default function UtmCampaignBuilderRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <UtmCampaignBuilderPage />
    </>
  );
}
