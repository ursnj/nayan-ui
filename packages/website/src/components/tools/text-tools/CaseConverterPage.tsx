"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { caseConverterTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { CaseConverter } from "@/components/tools";
import { CaseConverterContent } from "./TextToolsContent";

const CaseConverterPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Case Converter"}>
      <CaseConverter />

      <CaseConverterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={caseConverterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default CaseConverterPage;
