"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { colorConverterTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { ColorConverter } from "@/components/tools";
import { ColorConverterContent } from "./DevToolsContent";

const ColorConverterPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Color Converter"}>
      <ColorConverter />

      <ColorConverterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={colorConverterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default ColorConverterPage;
