"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { rotateImageTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { RotateImage } from "@/components/tools";
import { RotateImageContent } from "./ImageToolsContent";

const RotateImagePage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Rotate Image"}>
      <RotateImage />

      <RotateImageContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={rotateImageTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default RotateImagePage;
