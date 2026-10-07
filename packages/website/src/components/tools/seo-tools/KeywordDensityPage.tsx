"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { keywordDensityTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { KeywordDensityAnalyzer } from "@/components/tools";
import { KeywordDensityContent } from "./SeoToolsContent";

const KeywordDensityPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Keyword Density Analyzer"}>
      <KeywordDensityAnalyzer />

      <KeywordDensityContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={keywordDensityTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default KeywordDensityPage;
