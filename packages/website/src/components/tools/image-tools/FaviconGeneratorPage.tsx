"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { faviconGeneratorTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { FaviconGenerator } from "@/components/tools";
import { FaviconGeneratorContent } from "./ImageToolsContent";

const FaviconGeneratorPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Favicon Generator"}>
      <FaviconGenerator />

      <FaviconGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={faviconGeneratorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default FaviconGeneratorPage;
