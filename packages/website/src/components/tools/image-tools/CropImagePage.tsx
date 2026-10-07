"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { cropImageTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { CropImage } from "@/components/tools";
import { CropImageContent } from "./ImageToolsContent";

const CropImagePage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Crop Image"}>
      <CropImage />

      <CropImageContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={cropImageTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default CropImagePage;
