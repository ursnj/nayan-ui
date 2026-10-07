"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { jsonPathFinderTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { JsonPathFinder } from "@/components/tools";
import { JsonPathFinderContent } from "./JsonToolsContent";

const JsonPathFinderPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "JSON Path Finder"}>
      <JsonPathFinder />

      <JsonPathFinderContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonPathFinderTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonPathFinderPage;
