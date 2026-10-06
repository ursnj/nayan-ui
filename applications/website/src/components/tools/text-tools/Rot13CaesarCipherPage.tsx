"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import TagsList from "@/components/helpers/TagsList";
import { rot13CaesarCipherTags } from "@/services/Tags";
import { getMenuItem } from "@/services/Utils";
import { Rot13CaesarCipher } from "@/components/tools";
import { Rot13CaesarCipherContent } from "./TextToolsContent";

const Rot13CaesarCipherPage = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "ROT13 / Caesar Cipher"}>
      <Rot13CaesarCipher />

      <Rot13CaesarCipherContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={rot13CaesarCipherTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default Rot13CaesarCipherPage;
