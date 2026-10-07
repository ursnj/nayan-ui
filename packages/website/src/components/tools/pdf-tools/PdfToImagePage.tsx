"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { pdfToImageTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { PdfToImage } from "@/components/tools";
import { PdfToImageContent } from "./PdfToolsContent";

const PdfToImagePage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "PDF to Image"}>
      <PdfToImage />

      <PdfToImageContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={pdfToImageTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default PdfToImagePage;
