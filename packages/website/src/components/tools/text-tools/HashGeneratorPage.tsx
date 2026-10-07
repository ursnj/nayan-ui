"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { hashGeneratorTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { HashGenerator } from "@/components/tools";
import { HashGeneratorContent } from "./TextToolsContent";

const HashGeneratorPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Hash Generator"}>
      <HashGenerator />

      <HashGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={hashGeneratorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default HashGeneratorPage;
