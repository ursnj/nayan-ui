"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { sitemapTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { SitemapGenerator } from "@/components/tools";
import { SitemapGeneratorContent } from "./SeoToolsContent";

const SitemapPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Sitemap Generator"}>
      <SitemapGenerator />

      <SitemapGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={sitemapTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default SitemapPage;
