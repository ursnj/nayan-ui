"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { robotsTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { RobotsGenerator } from "@/components/tools";
import { RobotsGeneratorContent } from "./SeoToolsContent";

const RobotsPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Robots.txt Generator"}>
      <RobotsGenerator />

      <RobotsGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={robotsTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default RobotsPage;
