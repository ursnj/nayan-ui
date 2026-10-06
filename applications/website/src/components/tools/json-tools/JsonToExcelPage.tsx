"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { jsonToExcelTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { JsonToExcel } from "@/components/tools";
import { JsonToExcelContent } from "./JsonToolsContent";

const JsonToExcelPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "JSON to Excel"}>
      <JsonToExcel />

      <JsonToExcelContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonToExcelTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonToExcelPage;
