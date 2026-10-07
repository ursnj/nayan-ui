"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { pdfToWordTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { PdfToWord } from "@/components/tools";
import { PdfToWordContent } from "./PdfToolsContent";

const PdfToWordPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "PDF to Word"}>
      <PdfToWord />

      <PdfToWordContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={pdfToWordTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default PdfToWordPage;
