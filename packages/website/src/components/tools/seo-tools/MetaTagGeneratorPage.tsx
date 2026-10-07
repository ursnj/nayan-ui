"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { metaTagGeneratorTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { MetaTagGenerator } from "@/components/tools";
import { MetaTagGeneratorContent } from "./SeoToolsContent";

const MetaTagGeneratorPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Meta Tag Generator"}>
      <MetaTagGenerator />

      <MetaTagGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={metaTagGeneratorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default MetaTagGeneratorPage;
