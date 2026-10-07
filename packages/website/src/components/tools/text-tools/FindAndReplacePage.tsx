"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { findAndReplaceTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { FindAndReplace } from "@/components/tools";
import { FindAndReplaceContent } from "./TextToolsContent";

const FindAndReplacePage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Find & Replace"}>
      <FindAndReplace />

      <FindAndReplaceContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={findAndReplaceTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default FindAndReplacePage;
