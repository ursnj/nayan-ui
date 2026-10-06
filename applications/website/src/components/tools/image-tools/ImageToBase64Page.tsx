"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { imageToBase64Tags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { ImageToBase64 } from "@/components/tools";
import { ImageToBase64Content } from "./ImageToolsContent";

const ImageToBase64Page = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Image to Base64"}>
      <ImageToBase64 />

      <ImageToBase64Content />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={imageToBase64Tags} />
      </SubHeader>
    </Sidebar>
  );
};

export default ImageToBase64Page;
