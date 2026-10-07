"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { repairPdfTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { RepairPdf } from "@/components/tools";
import { RepairPdfContent } from "./PdfToolsContent";

const RepairPdfPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Repair PDF"}>
      <RepairPdf />

      <RepairPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={repairPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default RepairPdfPage;
