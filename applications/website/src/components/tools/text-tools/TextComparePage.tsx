"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { textCompareTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { TextCompare } from "@/components/tools";
import { TextCompareContent } from "./TextToolsContent";

const TextComparePage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Text Compare"}>
      <TextCompare />

      <TextCompareContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={textCompareTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default TextComparePage;
