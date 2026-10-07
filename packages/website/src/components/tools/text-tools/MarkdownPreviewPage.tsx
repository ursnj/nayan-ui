"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { markdownPreviewTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { MarkdownPreview } from "@/components/tools";
import { MarkdownPreviewContent } from "./TextToolsContent";

const MarkdownPreviewPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Markdown Preview"}>
      <MarkdownPreview />

      <MarkdownPreviewContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={markdownPreviewTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default MarkdownPreviewPage;
