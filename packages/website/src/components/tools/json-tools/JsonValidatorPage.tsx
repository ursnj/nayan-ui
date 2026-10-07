"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { jsonValidatorTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { JsonValidator } from "@/components/tools";
import { JsonValidatorContent } from "./JsonToolsContent";

const JsonValidatorPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "JSON Validator"}>
      <JsonValidator />

      <JsonValidatorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonValidatorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonValidatorPage;
