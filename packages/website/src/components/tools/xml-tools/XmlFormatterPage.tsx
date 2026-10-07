"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { xmlFormatterTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { XmlFormatter } from "@/components/tools";
import { XmlFormatterContent } from "./XmlToolsContent";

const XmlFormatterPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "XML Formatter"}>
      <XmlFormatter />

      <XmlFormatterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={xmlFormatterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default XmlFormatterPage;
