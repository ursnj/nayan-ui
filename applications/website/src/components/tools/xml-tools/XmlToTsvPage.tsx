"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { xmlToTsvTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { XmlToTsv } from "@/components/tools";
import { XmlToTsvContent } from "./XmlToolsContent";

const XmlToTsvPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "XML to TSV"}>
      <XmlToTsv />

      <XmlToTsvContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={xmlToTsvTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default XmlToTsvPage;
