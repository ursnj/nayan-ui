"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { xmlMinifierTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { XmlMinifier } from "@/components/tools";
import { XmlMinifierContent } from "./XmlToolsContent";

const XmlMinifierPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "XML Minifier"}>
      <XmlMinifier />

      <XmlMinifierContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={xmlMinifierTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default XmlMinifierPage;
