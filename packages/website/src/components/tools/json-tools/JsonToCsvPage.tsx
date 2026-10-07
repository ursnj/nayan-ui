"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { jsonToCsvTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { JsonToCsv } from "@/components/tools";
import { JsonToCsvContent } from "./JsonToolsContent";

const JsonToCsvPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "JSON to CSV"}>
      <JsonToCsv />

      <JsonToCsvContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonToCsvTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonToCsvPage;
