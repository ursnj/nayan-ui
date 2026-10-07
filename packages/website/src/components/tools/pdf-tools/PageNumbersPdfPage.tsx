"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { pageNumbersPdfTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { PageNumbersPdf } from "@/components/tools";
import { PageNumbersPdfContent } from "./PdfToolsContent";

const PageNumbersPdfPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Page Numbers"}>
      <PageNumbersPdf />

      <PageNumbersPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={pageNumbersPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default PageNumbersPdfPage;
