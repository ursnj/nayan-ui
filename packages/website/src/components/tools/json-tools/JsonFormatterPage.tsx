"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { jsonFormatterTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { JsonFormatter } from "@/components/tools";
import { JsonFormatterContent } from "./JsonToolsContent";

const JsonFormatterPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "JSON Formatter"}>
      <JsonFormatter />

      <JsonFormatterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonFormatterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonFormatterPage;
