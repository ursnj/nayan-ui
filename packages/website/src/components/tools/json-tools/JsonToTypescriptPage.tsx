"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { jsonToTypescriptTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { JsonToTypescript } from "@/components/tools";
import { JsonToTypescriptContent } from "./JsonToolsContent";

const JsonToTypescriptPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "JSON to TypeScript"}>
      <JsonToTypescript />

      <JsonToTypescriptContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonToTypescriptTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonToTypescriptPage;
