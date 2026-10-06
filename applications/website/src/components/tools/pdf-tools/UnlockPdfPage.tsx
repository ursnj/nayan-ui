"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { unlockPdfTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { UnlockPdf } from "@/components/tools";
import { UnlockPdfContent } from "./PdfToolsContent";

const UnlockPdfPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Unlock PDF"}>
      <UnlockPdf />

      <UnlockPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={unlockPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default UnlockPdfPage;
