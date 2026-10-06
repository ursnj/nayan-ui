"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { characterCounterTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { CharacterCounter } from "@/components/tools";
import { CharacterCounterContent } from "./TextToolsContent";

const CharacterCounterPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Character Counter"}>
      <CharacterCounter />

      <CharacterCounterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={characterCounterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default CharacterCounterPage;
