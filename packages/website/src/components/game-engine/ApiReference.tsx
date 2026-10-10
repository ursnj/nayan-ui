"use client";

import { DocsIntro } from "@/design/Primitives";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import {
  engineExportsCode,
  engineInputApiCode,
  engineMediaApiCode,
  engineTypesCode,
  engineWorldApiCode,
} from "@/services/GameEngineCodeBlocks";

const EngineApiReference = () => (
  <Sidebar title="API Reference">
    <DocsIntro lead="Everything @nayan-ui/engine exports, at a glance. Each guide page explains these with examples." />

    <SubHeader title="Exports">
      <Code code={engineExportsCode} filename="index.ts" />
    </SubHeader>

    <SubHeader title="World">
      <Code code={engineWorldApiCode} filename="World.d.ts" />
    </SubHeader>

    <SubHeader title="Types">
      <Code code={engineTypesCode} filename="types.d.ts" />
    </SubHeader>

    <SubHeader title="Audio & haptics">
      <Code code={engineMediaApiCode} filename="media.d.ts" />
    </SubHeader>

    <SubHeader title="Input">
      <Code code={engineInputApiCode} filename="input.d.ts" />
    </SubHeader>
  </Sidebar>
);

export default EngineApiReference;
