"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { openGraphPreviewTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { OpenGraphPreview } from "@/components/tools";
import { OpenGraphPreviewContent } from "./SeoToolsContent";

const OpenGraphPreviewPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Open Graph Preview"}>
      <OpenGraphPreview />

      <OpenGraphPreviewContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={openGraphPreviewTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default OpenGraphPreviewPage;
