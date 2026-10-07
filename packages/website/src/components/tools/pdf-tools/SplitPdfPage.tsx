"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { splitPdfTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { SplitPdf } from "@/components/tools";
import { SplitPdfContent } from "./PdfToolsContent";

const SplitPdfPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Split PDF"}>
      <SplitPdf />

      <SplitPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={splitPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default SplitPdfPage;
