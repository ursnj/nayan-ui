"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { base64EncoderDecoderTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { Base64EncoderDecoder } from "@/components/tools";
import { Base64EncoderDecoderContent } from "./TextToolsContent";

const Base64EncoderDecoderPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Base64 Encoder/Decoder"}>
      <Base64EncoderDecoder />

      <Base64EncoderDecoderContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={base64EncoderDecoderTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default Base64EncoderDecoderPage;
