"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { pdfToMarkdownTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { PdfToMarkdown } from "@/components/tools";
import { PdfToMarkdownContent } from "./PdfToolsContent";

const PdfToMarkdownPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "PDF to Markdown"}>
      <PdfToMarkdown />

      <PdfToMarkdownContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={pdfToMarkdownTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default PdfToMarkdownPage;
