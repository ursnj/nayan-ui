"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { regexTesterTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { RegexTester } from "@/components/tools";
import { RegexTesterContent } from "./TextToolsContent";

const RegexTesterPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Regex Tester"}>
      <RegexTester />

      <RegexTesterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={regexTesterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default RegexTesterPage;
