"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { htmlEntityEncoderDecoderTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { HtmlEntityEncoderDecoder } from "@/components/tools";
import { HtmlEntityEncoderDecoderContent } from "./DevToolsContent";

const HtmlEntityEncoderDecoderPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "HTML Entity Encoder/Decoder"}>
      <HtmlEntityEncoderDecoder />

      <HtmlEntityEncoderDecoderContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={htmlEntityEncoderDecoderTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default HtmlEntityEncoderDecoderPage;
