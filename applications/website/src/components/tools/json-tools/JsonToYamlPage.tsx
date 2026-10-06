"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { jsonToYamlTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { JsonToYaml } from "@/components/tools";
import { JsonToYamlContent } from "./JsonToolsContent";

const JsonToYamlPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "JSON to YAML"}>
      <JsonToYaml />

      <JsonToYamlContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonToYamlTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonToYamlPage;
