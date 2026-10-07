"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { watermarkImageTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { WatermarkImage } from "@/components/tools";
import { WatermarkImageContent } from "./ImageToolsContent";

const WatermarkImagePage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Watermark Image"}>
      <WatermarkImage />

      <WatermarkImageContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={watermarkImageTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default WatermarkImagePage;
