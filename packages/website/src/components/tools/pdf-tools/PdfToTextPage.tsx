"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { pdfToTextTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { PdfToText } from "@/components/tools";
import { PdfToTextContent } from "./PdfToolsContent";

const PdfToTextPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "PDF to Text"}>
      <PdfToText />

      <PdfToTextContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={pdfToTextTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default PdfToTextPage;
