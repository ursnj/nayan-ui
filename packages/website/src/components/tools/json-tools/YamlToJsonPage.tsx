"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { yamlToJsonTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { YamlToJson } from "@/components/tools";
import { YamlToJsonContent } from "./JsonToolsContent";

const YamlToJsonPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "YAML to JSON"}>
      <YamlToJson />

      <YamlToJsonContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={yamlToJsonTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default YamlToJsonPage;
