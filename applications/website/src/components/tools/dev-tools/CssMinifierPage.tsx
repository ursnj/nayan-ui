"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { cssMinifierTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { CssMinifier } from "@/components/tools";
import { CssMinifierContent } from "./DevToolsContent";

const CssMinifierPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "CSS Minifier"}>
      <CssMinifier />

      <CssMinifierContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={cssMinifierTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default CssMinifierPage;
