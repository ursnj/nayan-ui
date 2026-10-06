"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { serpSnippetPreviewTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { SerpSnippetPreview } from "@/components/tools";
import { SerpSnippetPreviewContent } from "./SeoToolsContent";

const SerpSnippetPreviewPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Google SERP Snippet Preview"}>
      <SerpSnippetPreview />

      <SerpSnippetPreviewContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={serpSnippetPreviewTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default SerpSnippetPreviewPage;
