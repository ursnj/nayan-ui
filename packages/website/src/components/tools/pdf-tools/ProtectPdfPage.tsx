"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { protectPdfTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { ProtectPdf } from "@/components/tools";
import { ProtectPdfContent } from "./PdfToolsContent";

const ProtectPdfPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Protect PDF"}>
      <ProtectPdf />

      <ProtectPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={protectPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default ProtectPdfPage;
