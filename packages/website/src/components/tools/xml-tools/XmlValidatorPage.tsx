"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { xmlValidatorTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { XmlValidator } from "@/components/tools";
import { XmlValidatorContent } from "./XmlToolsContent";

const XmlValidatorPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "XML Validator"}>
      <XmlValidator />

      <XmlValidatorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={xmlValidatorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default XmlValidatorPage;
