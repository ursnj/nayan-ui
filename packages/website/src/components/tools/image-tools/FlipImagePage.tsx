"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { flipImageTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { FlipImage } from "@/components/tools";
import { FlipImageContent } from "./ImageToolsContent";

const FlipImagePage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Flip Image"}>
      <FlipImage />

      <FlipImageContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={flipImageTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default FlipImagePage;
