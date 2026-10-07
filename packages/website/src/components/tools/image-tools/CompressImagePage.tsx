"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { compressImageTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { CompressImage } from "@/components/tools";
import { CompressImageContent } from "./ImageToolsContent";

const CompressImagePage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Compress Image"}>
      <CompressImage />

      <CompressImageContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={compressImageTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default CompressImagePage;
