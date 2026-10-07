"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { jsonToXmlTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { JsonToXml } from "@/components/tools";
import { JsonToXmlContent } from "./JsonToolsContent";

const JsonToXmlPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "JSON to XML"}>
      <JsonToXml />

      <JsonToXmlContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonToXmlTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonToXmlPage;
