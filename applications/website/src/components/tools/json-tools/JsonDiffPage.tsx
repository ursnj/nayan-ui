"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { jsonDiffTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { JsonDiff } from "@/components/tools";
import { JsonDiffContent } from "./JsonToolsContent";

const JsonDiffPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "JSON Diff"}>
      <JsonDiff />

      <JsonDiffContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonDiffTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonDiffPage;
