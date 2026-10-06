"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { letterFrequencyAnalyzerTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { LetterFrequencyAnalyzer } from "@/components/tools";
import { LetterFrequencyAnalyzerContent } from "./TextToolsContent";

const LetterFrequencyAnalyzerPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Letter Frequency Analyzer"}>
      <LetterFrequencyAnalyzer />

      <LetterFrequencyAnalyzerContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={letterFrequencyAnalyzerTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default LetterFrequencyAnalyzerPage;
