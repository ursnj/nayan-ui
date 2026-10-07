"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { textReverserTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { TextReverser } from "@/components/tools";
import { TextReverserContent } from "./TextToolsContent";

const TextReverserPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Text Reverser"}>
      <TextReverser />

      <TextReverserContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={textReverserTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default TextReverserPage;
