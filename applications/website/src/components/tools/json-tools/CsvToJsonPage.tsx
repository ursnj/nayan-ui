"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { csvToJsonTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { CsvToJson } from "@/components/tools";
import { CsvToJsonContent } from "./JsonToolsContent";

const CsvToJsonPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "CSV to JSON"}>
      <CsvToJson />

      <CsvToJsonContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={csvToJsonTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default CsvToJsonPage;
