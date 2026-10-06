"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { signPdfTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { SignPdf } from "@/components/tools";
import { SignPdfContent } from "./PdfToolsContent";

const SignPdfPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Sign PDF"}>
      <SignPdf />

      <SignPdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={signPdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default SignPdfPage;
