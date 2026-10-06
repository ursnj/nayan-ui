"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { xmlToYamlTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { XmlToYaml } from "@/components/tools";
import { XmlToYamlContent } from "./XmlToolsContent";

const XmlToYamlPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "XML to YAML"}>
      <XmlToYaml />

      <XmlToYamlContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={xmlToYamlTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default XmlToYamlPage;
