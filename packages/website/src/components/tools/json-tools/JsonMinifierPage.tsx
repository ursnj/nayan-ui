"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { jsonMinifierTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { JsonMinifier } from "@/components/tools";
import { JsonMinifierContent } from "./JsonToolsContent";

const JsonMinifierPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "JSON Minifier"}>
      <JsonMinifier />

      <JsonMinifierContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonMinifierTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonMinifierPage;
