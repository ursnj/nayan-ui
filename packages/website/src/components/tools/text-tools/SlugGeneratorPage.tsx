"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { slugGeneratorTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { SlugGenerator } from "@/components/tools";
import { SlugGeneratorContent } from "./TextToolsContent";

const SlugGeneratorPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Slug Generator"}>
      <SlugGenerator />

      <SlugGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={slugGeneratorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default SlugGeneratorPage;
