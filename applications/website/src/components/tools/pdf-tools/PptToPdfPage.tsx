"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { pptToPdfTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { PptToPdf } from "@/components/tools";
import { PptToPdfContent } from "./PdfToolsContent";

const PptToPdfPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "PowerPoint to PDF"}>
      <PptToPdf />

      <PptToPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={pptToPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default PptToPdfPage;
