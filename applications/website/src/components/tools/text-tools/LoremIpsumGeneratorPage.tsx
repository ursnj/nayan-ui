"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { loremIpsumGeneratorTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { LoremIpsumGenerator } from "@/components/tools";
import { LoremIpsumGeneratorContent } from "./TextToolsContent";

const LoremIpsumGeneratorPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Lorem Ipsum Generator"}>
      <LoremIpsumGenerator />

      <LoremIpsumGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={loremIpsumGeneratorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default LoremIpsumGeneratorPage;
