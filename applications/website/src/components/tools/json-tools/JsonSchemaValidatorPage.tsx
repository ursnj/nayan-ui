"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { jsonSchemaValidatorTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { JsonSchemaValidator } from "@/components/tools";
import { JsonSchemaValidatorContent } from "./JsonToolsContent";

const JsonSchemaValidatorPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "JSON Schema Validator"}>
      <JsonSchemaValidator />

      <JsonSchemaValidatorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jsonSchemaValidatorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JsonSchemaValidatorPage;
