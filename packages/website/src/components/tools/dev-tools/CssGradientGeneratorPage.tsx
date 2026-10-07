"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { cssGradientGeneratorTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { CssGradientGenerator } from "@/components/tools";
import { CssGradientGeneratorContent } from "./DevToolsContent";

const CssGradientGeneratorPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "CSS Gradient Generator"}>
      <CssGradientGenerator />

      <CssGradientGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={cssGradientGeneratorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default CssGradientGeneratorPage;
