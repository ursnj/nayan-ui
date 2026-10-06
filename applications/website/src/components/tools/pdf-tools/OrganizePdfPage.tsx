"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { organizePdfTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { OrganizePdf } from "@/components/tools";
import { OrganizePdfContent } from "./PdfToolsContent";

const OrganizePdfPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Organize PDF"}>
      <OrganizePdf />

      <OrganizePdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={organizePdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default OrganizePdfPage;
