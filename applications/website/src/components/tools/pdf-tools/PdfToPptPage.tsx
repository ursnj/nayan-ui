"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { pdfToPptTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { PdfToPpt } from "@/components/tools";
import { PdfToPptContent } from "./PdfToolsContent";

const PdfToPptPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "PDF to PowerPoint"}>
      <PdfToPpt />

      <PdfToPptContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={pdfToPptTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default PdfToPptPage;
