"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { jsonQueryStringConverterTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { JsonQueryStringConverter } from "@/components/tools";
import { JsonQueryStringConverterContent } from "./JsonToolsContent";

const JsonQueryStringConverterPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "JSON ⇄ Query String"}>
      <JsonQueryStringConverter />

      <JsonQueryStringConverterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonQueryStringConverterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonQueryStringConverterPage;
