"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { xmlToCsvTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { XmlToCsv } from "@/components/tools";
import { XmlToCsvContent } from "./XmlToolsContent";

const XmlToCsvPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "XML to CSV"}>
      <XmlToCsv />

      <XmlToCsvContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={xmlToCsvTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default XmlToCsvPage;
