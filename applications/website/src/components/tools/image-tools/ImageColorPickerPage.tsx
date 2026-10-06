"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { imageColorPickerTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { ImageColorPicker } from "@/components/tools";
import { ImageColorPickerContent } from "./ImageToolsContent";

const ImageColorPickerPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Image Color Picker"}>
      <ImageColorPicker />

      <ImageColorPickerContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={imageColorPickerTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default ImageColorPickerPage;
