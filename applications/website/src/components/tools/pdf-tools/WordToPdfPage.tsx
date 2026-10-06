"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { wordToPdfTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { WordToPdf } from "@/components/tools";
import { WordToPdfContent } from "./PdfToolsContent";

const WordToPdfPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Word to PDF"}>
      <WordToPdf />

      <WordToPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={wordToPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default WordToPdfPage;
