"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { schemaMarkupGeneratorTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { SchemaMarkupGenerator } from "@/components/tools";
import { SchemaMarkupGeneratorContent } from "./SeoToolsContent";

const SchemaMarkupGeneratorPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Schema Markup Generator"}>
      <SchemaMarkupGenerator />

      <SchemaMarkupGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={schemaMarkupGeneratorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default SchemaMarkupGeneratorPage;
