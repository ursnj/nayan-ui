"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { robotsValidatorTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { RobotsValidator } from "@/components/tools";
import { RobotsValidatorContent } from "./SeoToolsContent";

const RobotsValidatorPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Robots.txt Validator"}>
      <RobotsValidator />

      <RobotsValidatorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={robotsValidatorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default RobotsValidatorPage;
