"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { uuidGeneratorTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { UuidGenerator } from "@/components/tools";
import { UuidGeneratorContent } from "./DevToolsContent";

const UuidGeneratorPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "UUID Generator"}>
      <UuidGenerator />

      <UuidGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={uuidGeneratorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default UuidGeneratorPage;
