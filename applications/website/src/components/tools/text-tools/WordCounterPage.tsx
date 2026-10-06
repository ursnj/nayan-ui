"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { wordCounterTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { WordCounter } from "@/components/tools";
import { WordCounterContent } from "./TextToolsContent";

const WordCounterPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Word Counter"}>
      <WordCounter />

      <WordCounterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={wordCounterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default WordCounterPage;
