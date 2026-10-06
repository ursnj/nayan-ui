"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { textToBinaryTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { TextToBinary } from "@/components/tools";
import { TextToBinaryContent } from "./TextToolsContent";

const TextToBinaryPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Text to Binary"}>
      <TextToBinary />

      <TextToBinaryContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={textToBinaryTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default TextToBinaryPage;
