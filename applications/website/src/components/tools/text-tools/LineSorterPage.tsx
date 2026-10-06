"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { lineSorterTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { LineSorter } from "@/components/tools";
import { LineSorterContent } from "./TextToolsContent";

const LineSorterPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Line Sorter"}>
      <LineSorter />

      <LineSorterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={lineSorterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default LineSorterPage;
