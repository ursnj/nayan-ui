"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { xpathTesterTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { XPathTester } from "@/components/tools";
import { XPathTesterContent } from "./XmlToolsContent";

const XPathTesterPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "XPath Tester"}>
      <XPathTester />

      <XPathTesterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={xpathTesterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default XPathTesterPage;
