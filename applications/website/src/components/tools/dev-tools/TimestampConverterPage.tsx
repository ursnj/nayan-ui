"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { timestampConverterTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { TimestampConverter } from "@/components/tools";
import { TimestampConverterContent } from "./DevToolsContent";

const TimestampConverterPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Timestamp Converter"}>
      <TimestampConverter />

      <TimestampConverterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={timestampConverterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default TimestampConverterPage;
