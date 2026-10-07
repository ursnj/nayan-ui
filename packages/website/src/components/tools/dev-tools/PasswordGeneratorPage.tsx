"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { passwordGeneratorTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { PasswordGenerator } from "@/components/tools";
import { PasswordGeneratorContent } from "./DevToolsContent";

const PasswordGeneratorPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Password Generator"}>
      <PasswordGenerator />

      <PasswordGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={passwordGeneratorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default PasswordGeneratorPage;
