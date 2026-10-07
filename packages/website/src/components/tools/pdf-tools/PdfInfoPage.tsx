"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { pdfInfoTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { PdfInfo } from "@/components/tools";
import { PdfInfoContent } from "./PdfToolsContent";

const PdfInfoPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "PDF Info"}>
      <PdfInfo />

      <PdfInfoContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={pdfInfoTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default PdfInfoPage;
