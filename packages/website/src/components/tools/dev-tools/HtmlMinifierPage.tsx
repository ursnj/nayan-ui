"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { htmlMinifierTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { HtmlMinifier } from "@/components/tools";
import { HtmlMinifierContent } from "./DevToolsContent";

const HtmlMinifierPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "HTML Minifier"}>
      <HtmlMinifier />

      <HtmlMinifierContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={htmlMinifierTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default HtmlMinifierPage;
