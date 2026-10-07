"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { rotatePdfTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { RotatePdf } from "@/components/tools";
import { RotatePdfContent } from "./PdfToolsContent";

const RotatePdfPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Rotate PDF"}>
      <RotatePdf />

      <RotatePdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={rotatePdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default RotatePdfPage;
