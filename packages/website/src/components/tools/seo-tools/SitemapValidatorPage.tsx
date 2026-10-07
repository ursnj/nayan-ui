"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { sitemapValidatorTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { SitemapValidator } from "@/components/tools";
import { SitemapValidatorContent } from "./SeoToolsContent";

const SitemapValidatorPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Sitemap Validator"}>
      <SitemapValidator />

      <SitemapValidatorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={sitemapValidatorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default SitemapValidatorPage;
