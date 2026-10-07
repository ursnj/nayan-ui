"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { qrCodeGeneratorTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { QrCodeGenerator } from "@/components/tools";
import { QrCodeGeneratorContent } from "./DevToolsContent";

const QrCodeGeneratorPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "QR Code Generator"}>
      <QrCodeGenerator />

      <QrCodeGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={qrCodeGeneratorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default QrCodeGeneratorPage;
