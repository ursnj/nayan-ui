"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { pdfToExcelTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { PdfToExcel } from "@/components/tools";
import { PdfToExcelContent } from "./PdfToolsContent";

const PdfToExcelPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "PDF to Excel"}>
      <PdfToExcel />

      <PdfToExcelContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={pdfToExcelTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default PdfToExcelPage;
