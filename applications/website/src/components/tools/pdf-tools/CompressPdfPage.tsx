"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { compressPdfTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { CompressPdf } from "@/components/tools";
import { CompressPdfContent } from "./PdfToolsContent";

const CompressPdfPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Compress PDF"}>
      <CompressPdf />

      <CompressPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={compressPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default CompressPdfPage;
