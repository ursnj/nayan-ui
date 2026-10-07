"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { utmCampaignBuilderTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { UtmCampaignBuilder } from "@/components/tools";
import { UtmCampaignBuilderContent } from "./SeoToolsContent";

const UtmCampaignBuilderPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "UTM Campaign URL Builder"}>
      <UtmCampaignBuilder />

      <UtmCampaignBuilderContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={utmCampaignBuilderTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default UtmCampaignBuilderPage;
