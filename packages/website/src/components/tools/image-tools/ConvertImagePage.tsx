"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { convertImageTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { ConvertImage } from "@/components/tools";
import { ConvertImageContent } from "./ImageToolsContent";

const ConvertImagePage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Convert Image"}>
      <ConvertImage />

      <ConvertImageContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={convertImageTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default ConvertImagePage;
