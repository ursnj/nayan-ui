"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { numberBaseConverterTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { NumberBaseConverter } from "@/components/tools";
import { NumberBaseConverterContent } from "./DevToolsContent";

const NumberBaseConverterPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Number Base Converter"}>
      <NumberBaseConverter />

      <NumberBaseConverterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={numberBaseConverterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default NumberBaseConverterPage;
