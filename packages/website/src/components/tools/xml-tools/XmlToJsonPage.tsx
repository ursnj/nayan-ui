"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { xmlToJsonTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { XmlToJson } from "@/components/tools";
import { XmlToJsonContent } from "./XmlToolsContent";

const XmlToJsonPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "XML to JSON"}>
      <XmlToJson />

      <XmlToJsonContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={xmlToJsonTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default XmlToJsonPage;
