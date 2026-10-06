"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { jwtDecoderTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { JwtDecoder } from "@/components/tools";
import { JwtDecoderContent } from "./DevToolsContent";

const JwtDecoderPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "JWT Decoder"}>
      <JwtDecoder />

      <JwtDecoderContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={jwtDecoderTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default JwtDecoderPage;
