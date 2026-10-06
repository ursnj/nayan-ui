"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { cropPdfTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { CropPdf } from "@/components/tools";
import { CropPdfContent } from "./PdfToolsContent";

const CropPdfPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Crop PDF"}>
      <CropPdf />

      <CropPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={cropPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default CropPdfPage;
