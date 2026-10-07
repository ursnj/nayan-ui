"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { jsonToTsvTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { JsonToTsv } from "@/components/tools";
import { JsonToTsvContent } from "./JsonToolsContent";

const JsonToTsvPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "JSON to TSV"}>
      <JsonToTsv />

      <JsonToTsvContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonToTsvTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonToTsvPage;
