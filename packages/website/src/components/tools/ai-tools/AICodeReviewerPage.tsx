"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { aiReviewTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import AICodeReviewer from "./AICodeReviewer";

const AICodeReviewerPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "AI Code Reviewer"}>
      <AICodeReviewer />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={aiReviewTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default AICodeReviewerPage;
