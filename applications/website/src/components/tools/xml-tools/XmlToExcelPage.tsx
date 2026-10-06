"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { xmlToExcelTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { XmlToExcel } from "@/components/tools";
import { XmlToExcelContent } from "./XmlToolsContent";

const XmlToExcelPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "XML to Excel"}>
      <XmlToExcel />

      <XmlToExcelContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={xmlToExcelTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default XmlToExcelPage;
