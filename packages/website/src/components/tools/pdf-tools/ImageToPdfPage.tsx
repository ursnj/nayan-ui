"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { imageToPdfTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { ImageToPdf } from "@/components/tools";
import { ImageToPdfContent } from "./PdfToolsContent";

const ImageToPdfPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Image to PDF"}>
      <ImageToPdf />

      <ImageToPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={imageToPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default ImageToPdfPage;
