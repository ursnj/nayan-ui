"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { csvToXmlTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { CsvToXml } from "@/components/tools";
import { CsvToXmlContent } from "./XmlToolsContent";

const CsvToXmlPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "CSV to XML"}>
      <CsvToXml />

      <CsvToXmlContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={csvToXmlTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default CsvToXmlPage;
