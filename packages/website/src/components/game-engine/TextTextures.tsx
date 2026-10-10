"use client";

import { DocsIntro } from "@/design/Primitives";
import { BODY } from "@/design/system";
import Attributes from "@/components/helpers/Attributes";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import {
  engineAtlasCode,
  engineFontCode,
  engineTextTileCode,
  engineTextureCode,
  engineTransparencyCode,
} from "@/services/GameEngineCodeBlocks";
import {
  fontAttributes,
  fontOptionsAttributes,
  textOptionsAttributes,
  textureAttributes,
} from "@/services/GameEngineData";

const EngineTextTextures = () => (
  <Sidebar title="Text & Textures">
    <DocsIntro lead="Write scores, numbers and labels as real 3D text, put images on shapes, and make things see-through. Good for board games, puzzles and card games." />

    <SubHeader
      title="3D text"
      description="Load a TTF or OTF font once, then spawn text like any other entity."
    >
      <Code code={engineFontCode} filename="score.ts" />
    </SubHeader>

    <Attributes title="loadFont options" data={fontOptionsAttributes} />

    <Attributes title="Text entity options" data={textOptionsAttributes} />

    <Attributes title="Font" data={fontAttributes} headers={{ default: "" }} unit="field" />

    <SubHeader
      title="Text on a tile"
      description="Lay text flat with a rotation and attach it to the thing it labels."
    >
      <Code code={engineTextTileCode} filename="tiles.ts" />
    </SubHeader>

    <SubHeader title="How text works">
      <ul className={`space-y-2 ${BODY}`}>
        <li>
          • Each character becomes an extruded mesh, lit and shadowed like any shape. Every copy of a letter on
          screen is drawn in one call.
        </li>
        <li>
          • A text entity is an invisible root with one child entity per letter. Letters count against the
          world&apos;s capacity.
        </li>
        <li>
          • Text needs a <code>font</code>. Characters missing from <code>chars</code> show as{" "}
          <code>?</code> when <code>?</code> was built, and are skipped otherwise.
        </li>
        <li>• Text is a single line.</li>
      </ul>
    </SubHeader>

    <SubHeader
      title="Textures"
      description="Load a PNG or JPEG once, then draw it on any built-in shape or model."
    >
      <Code code={engineTextureCode} filename="crates.ts" />
    </SubHeader>

    <Attributes title="Texture" data={textureAttributes} headers={{ default: "" }} unit="field" />

    <SubHeader
      title="Atlases and cards"
      description="Pack many images into one texture and show part of it with textureRegion. Sprite sheets work the same way."
    >
      <Code code={engineAtlasCode} filename="cards.ts" />
    </SubHeader>

    <SubHeader
      title="Transparency"
      description="Any color with alpha below 1 is see-through: glass, ghosts, highlights and fades."
    >
      <Code code={engineTransparencyCode} filename="effects.ts" />
    </SubHeader>

    <SubHeader title="Good to know">
      <ul className={`space-y-2 ${BODY}`}>
        <li>
          • Metro bundles <code>.png</code>, <code>.jpg</code>, <code>.ttf</code> and <code>.otf</code> by default,
          so <code>require</code> works without config.
        </li>
        <li>
          • Loading the same file again returns the cached texture or font.
        </li>
        <li>
          • Models, font letters and textured shapes share 240 mesh ids. Each shape and texture pair takes one, and so
          does each visible character in <code>chars</code>.
        </li>
        <li>
          • glTF models keep their own base color texture. See 3D Models.
        </li>
      </ul>
    </SubHeader>
  </Sidebar>
);

export default EngineTextTextures;
