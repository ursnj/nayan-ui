"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { watermarkPdfTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { WatermarkPdf } from "@/components/tools";
import { WatermarkPdfContent } from "./PdfToolsContent";

const WatermarkPdfPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Watermark PDF"}>
      <WatermarkPdf />

      <WatermarkPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={watermarkPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default WatermarkPdfPage;
