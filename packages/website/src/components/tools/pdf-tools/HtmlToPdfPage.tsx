"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { htmlToPdfTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { HtmlToPdf } from "@/components/tools";
import { HtmlToPdfContent } from "./PdfToolsContent";

const HtmlToPdfPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "HTML to PDF"}>
      <HtmlToPdf />

      <HtmlToPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={htmlToPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default HtmlToPdfPage;
