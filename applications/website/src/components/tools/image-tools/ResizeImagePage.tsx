"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { resizeImageTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { ResizeImage } from "@/components/tools";
import { ResizeImageContent } from "./ImageToolsContent";

const ResizeImagePage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Resize Image"}>
      <ResizeImage />

      <ResizeImageContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={resizeImageTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default ResizeImagePage;
