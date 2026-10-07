"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { cronExpressionParserTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { CronExpressionParser } from "@/components/tools";
import { CronExpressionParserContent } from "./DevToolsContent";

const CronExpressionParserPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Cron Expression Parser"}>
      <CronExpressionParser />

      <CronExpressionParserContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={cronExpressionParserTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default CronExpressionParserPage;
