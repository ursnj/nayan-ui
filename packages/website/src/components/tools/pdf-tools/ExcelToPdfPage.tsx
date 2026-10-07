"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { excelToPdfTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { ExcelToPdf } from "@/components/tools";
import { ExcelToPdfContent } from "./PdfToolsContent";

const ExcelToPdfPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Excel to PDF"}>
      <ExcelToPdf />

      <ExcelToPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={excelToPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default ExcelToPdfPage;
