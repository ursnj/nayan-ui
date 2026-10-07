"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { imageExifViewerTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { ImageExifViewer } from "@/components/tools";
import { ImageExifViewerContent } from "./ImageToolsContent";

const ImageExifViewerPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Image EXIF Viewer"}>
      <ImageExifViewer />

      <ImageExifViewerContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={imageExifViewerTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default ImageExifViewerPage;
