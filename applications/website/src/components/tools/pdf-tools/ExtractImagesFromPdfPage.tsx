"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { extractImagesFromPdfTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { ExtractImagesFromPdf } from "@/components/tools";
import { ExtractImagesFromPdfContent } from "./PdfToolsContent";

const ExtractImagesFromPdfPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Extract Images from PDF"}>
      <ExtractImagesFromPdf />

      <ExtractImagesFromPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={extractImagesFromPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default ExtractImagesFromPdfPage;
