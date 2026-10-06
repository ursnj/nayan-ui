"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { pdfMetadataEditorTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { PdfMetadataEditor } from "@/components/tools";
import { PdfMetadataEditorContent } from "./PdfToolsContent";

const PdfMetadataEditorPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "PDF Metadata Editor"}>
      <PdfMetadataEditor />

      <PdfMetadataEditorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={pdfMetadataEditorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default PdfMetadataEditorPage;
