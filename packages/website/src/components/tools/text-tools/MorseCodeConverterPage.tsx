"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { morseCodeConverterTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { MorseCodeConverter } from "@/components/tools";
import { MorseCodeConverterContent } from "./TextToolsContent";

const MorseCodeConverterPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Morse Code Converter"}>
      <MorseCodeConverter />

      <MorseCodeConverterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={morseCodeConverterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default MorseCodeConverterPage;
