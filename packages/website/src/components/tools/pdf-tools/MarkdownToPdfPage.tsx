"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { markdownToPdfTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { MarkdownToPdf } from "@/components/tools";
import { MarkdownToPdfContent } from "./PdfToolsContent";

const MarkdownToPdfPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Markdown to PDF"}>
      <MarkdownToPdf />

      <MarkdownToPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={markdownToPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default MarkdownToPdfPage;
