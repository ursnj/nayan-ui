"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { yamlToXmlTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { YamlToXml } from "@/components/tools";
import { YamlToXmlContent } from "./XmlToolsContent";

const YamlToXmlPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "YAML to XML"}>
      <YamlToXml />

      <YamlToXmlContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={yamlToXmlTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default YamlToXmlPage;
