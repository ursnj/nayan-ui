"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { urlEncoderDecoderTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { UrlEncoderDecoder } from "@/components/tools";
import { UrlEncoderDecoderContent } from "./SeoToolsContent";

const UrlEncoderDecoderPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "URL Encoder/Decoder"}>
      <UrlEncoderDecoder />

      <UrlEncoderDecoderContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={urlEncoderDecoderTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default UrlEncoderDecoderPage;
