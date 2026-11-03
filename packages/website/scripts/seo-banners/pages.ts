// Every page that gets its own social banner, built from the same data the pages render
// (sidebar items, engine guides, games data), so a banner always says what its page shows.
//
// Tag pages (/react/tags/*, /react-native/tags/*, /tools/tags/*) are not listed: each renders the
// one component or tool it belongs to, so it reuses that page's banner (see src/services/seo.ts).
import type { LucideIcon } from "lucide-react";
import {
  AlignLeft,
  Atom,
  BatteryMedium,
  Bone,
  BookOpen,
  Box,
  Brush,
  ChefHat,
  ChevronsRight,
  Cpu,
  Ellipsis,
  Globe,
  Monitor,
  MousePointerClick,
  Orbit,
  Play,
  SeparatorHorizontal,
  Smartphone,
  Spline,
  ToggleLeft,
  Zap,
  Clapperboard,
  Download,
  FileCode,
  FileText,
  Gamepad2,
  HeartHandshake,
  Image as ImageIcon,
  LayoutGrid,
  Scale,
  Search,
  Sparkles,
  Tag,
  Tags,
  Terminal,
  Type,
  Wrench,
} from "lucide-react";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GAME_COUNT,
  NATIVE_COMPONENT_COUNT,
  REACT_COMPONENT_COUNT,
  TOOL_COUNT,
  TOTAL_COMPONENT_COUNT,
} from "../../src/services/Counts";
import { gamesData } from "../../src/services/GamesData";
import {
  engineSidebarItems,
  gamesSidebarItems,
  reactNativeSidebarItems,
  reactSidebarItems,
  toolsSidebarItems,
} from "../../src/services/Utils";

/** The right-hand composition. Each kind is a small product mock-up of what the page offers. */
export type Visual =
  /** A desktop app window with an abstract UI built around the icon (React components). */
  | { kind: "app"; icon: LucideIcon; label: string }
  /** A phone with an abstract native UI (React Native components). */
  | { kind: "phone"; icon: LucideIcon; label: string }
  /** A browser window with an address bar and a drop zone (tools). */
  | { kind: "browser"; icon: LucideIcon; label: string }
  /** A code editor (guides and docs). */
  | { kind: "code"; icon: LucideIcon; label: string }
  /** A terminal running the real install command. */
  | { kind: "terminal"; icon: LucideIcon; command: string }
  /** A phone showing a screenshot (one game). */
  | { kind: "shot"; src: string }
  /** Three phones fanned out (the games hub). */
  | { kind: "shots"; srcs: string[] }
  /** A bento grid of icon tiles (section hubs). */
  | { kind: "bento"; icons: LucideIcon[] }
  /** A wide app screenshot in a browser window. */
  | { kind: "screen"; src: string; label: string };

export interface BannerSpec {
  /** The page's URL path. */
  path: string;
  /** The small label above the title: what kind of page this is. */
  eyebrow: string;
  title: string;
  /** One short line; left off the banner when it doesn't fit on one line. */
  tagline: string;
  /** A small monospace chip over the visual, e.g. the npm package. */
  chip?: string;
  /** Accent gradient, start and end. */
  theme: [string, string];
  visual: Visual;
}

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), "../../public");
const pub = (file: string) => join(PUBLIC, file);

const THEME = {
  brand: ["#6366f1", "#d946ef"],
  react: ["#6366f1", "#0ea5e9"],
  native: ["#8b5cf6", "#d946ef"],
  engine: ["#f97316", "#ec4899"],
  games: ["#ec4899", "#8b5cf6"],
  video: ["#ef4444", "#ec4899"],
  tools: ["#6366f1", "#a855f7"],
} satisfies Record<string, [string, string]>;

/** Tool categories (the sidebar headings): label, accent and the icon for the tools overview. */
const TOOL_CATEGORY: Record<string, { label: string; theme: [string, string]; icon: LucideIcon }> =
  {
    "AI Tools": { label: "AI Tool", theme: ["#d946ef", "#7c3aed"], icon: Sparkles },
    "Image Tools": { label: "Free Image Tool", theme: ["#10b981", "#0ea5e9"], icon: ImageIcon },
    "PDF Tools": { label: "Free PDF Tool", theme: ["#f43f5e", "#f97316"], icon: FileText },
    "JSON Tools": { label: "Free JSON Tool", theme: ["#f59e0b", "#ea580c"], icon: FileCode },
    "XML Tools": { label: "Free XML Tool", theme: ["#14b8a6", "#22c55e"], icon: FileCode },
    "Text Tools": { label: "Free Text Tool", theme: ["#3b82f6", "#06b6d4"], icon: Type },
    "SEO Tools": { label: "Free SEO Tool", theme: ["#84cc16", "#10b981"], icon: Search },
    "Developer Tools": {
      label: "Free Developer Tool",
      theme: ["#6366f1", "#06b6d4"],
      icon: Terminal,
    },
  };

/**
 * The component pages' descriptions are paragraphs; a banner gets one line. Shared by the React and
 * React Native pages of the same component.
 */
const COMPONENT_TAGLINES: Record<string, string> = {
  Accordion: "Expand and collapse sections of content",
  Alert: "Success, warning and error messages at a glance",
  Avatar: "User photos with initials as a fallback",
  "Avatar Group": "Stacked avatars for teams and members",
  Badge: "Counts and status markers on any element",
  Breadcrumbs: "Show users where they are in your app",
  Button: "Accessible buttons in every variant and size",
  "Button Group": "Related actions grouped into one control",
  Calendar: "An accessible month view for picking dates",
  Card: "Group related content and actions",
  Checkbox: "Accessible checkboxes for forms and lists",
  "Checkbox Group": "Pick several options from one list",
  Chip: "Compact labels for tags, filters and choices",
  "Confirm Alert": "Ask users to confirm before they act",
  "Date Field": "Type a date segment by segment",
  "Date Picker": "Pick a date from a calendar popover",
  "Date Range Picker": "Pick a start and end date in one control",
  Dialog: "Modal dialogs for focused tasks",
  Disclosure: "Show and hide a section of content",
  Divider: "Separate content with a clean line",
  "Empty State": "Guide users when there is nothing to show",
  "Infinite Scroll": "Load more content as users scroll",
  Input: "Text fields with labels and validation",
  "Input OTP": "One-time passcode entry, digit by digit",
  "Keyboard Key": "Show keyboard shortcuts in your UI",
  Link: "Accessible links for any destination",
  Linkify: "Turn URLs in plain text into links",
  "List Box": "Selectable lists with keyboard navigation",
  Loading: "Spinners for pages, buttons and sections",
  "Dropdown Menu": "Menus of actions behind one trigger",
  Meter: "Show a value within a known range",
  "Number Field": "Numeric input with increment and decrement",
  Pagination: "Move through pages of results",
  Popover: "Floating content anchored to a trigger",
  Progress: "Show how far a task has come",
  "Progress Circle": "Circular progress for tasks and uploads",
  "Radio Group": "Pick exactly one option from a set",
  "Scroll Shadow": "Fade the edges to hint at more content",
  Select: "Pick one option from a dropdown list",
  "Search Field": "A text field built for search queries",
  Sheet: "Panels that slide in from the edge",
  Skeleton: "Placeholder shapes while content loads",
  Slider: "Pick a value by dragging a handle",
  Switch: "Turn a setting on or off",
  "Switch Group": "Several on/off settings in one group",
  Table: "Show rows of data in clear columns",
  "Tag Group": "A set of tags users can select",
  Tabs: "Switch between views in one place",
  Textarea: "Multi-line text input for longer answers",
  "Time Field": "Type a time segment by segment",
  Toast: "Brief notifications that dismiss themselves",
  "Toggle Button": "A button that stays pressed",
  Toolbar: "Group related controls in one bar",
  Tooltip: "Short hints on hover and focus",
};

/** Sidebar descriptions that run past two lines on a banner. */
const TAGLINE_OVERRIDES: Record<string, string> = {
  "/tools/compress-image": "Shrink JPG, PNG, SVG and GIF files, keep the quality",
  "/tools/watermark-image": "Stamp text or a logo over your images",
  "/tools/favicon-generator": "A full favicon set, webmanifest and HTML markup",
  "/tools/robots-generator": "Build robots.txt rules for every crawler",
  "/tools/open-graph-preview": "See how your page looks when it is shared",
  "/tools/serp-snippet-preview": "See your title and description as Google shows them",
  "/tools/utm-campaign-builder": "Build correctly encoded UTM tracking links",
  "/tools/password-generator": "Strong, cryptographically secure passwords",
  "/tools/number-base-converter": "Binary, octal, decimal and hex, both ways",
  "/tools/html-entity-encoder-decoder": "Encode and decode HTML entities",
  "/tools/css-gradient-generator": "Design CSS gradients visually and copy the code",
  "/tools/cron-expression-parser": "Read, validate and preview cron schedules",
  "/tools/morse-code-converter": "Convert text to Morse code and back",
  "/tools/letter-frequency-analyzer": "Count how often each letter appears",
  "/tools/xpath-tester": "Test XPath expressions and see matched nodes",
  "/tools/csv-to-xml": "Turn CSV spreadsheets into well-formed XML",
  "/tools/json-flatten-unflatten": "Nested JSON to dot-notation keys, and back",
  "/tools/schema-markup-generator": "JSON-LD for FAQ, Article, Product and more",
  "/tools/meta-tag-generator": "Meta, Open Graph and Twitter Card tags",
  "/tools/sitemap-generator": "Create XML sitemaps with priority and frequency",
  "/tools/image-color-picker": "Pick exact colors and extract the palette",
  "/tools/image-exif-viewer": "Camera, exposure and GPS data in your photos",
  "/tools/pdf-info": "Page count, size, version, encryption and words",
  "/game-engine": "3D games for React and React Native on a Rust core",
  "/game-engine/world-entities": "Spawn, change and dispose entities safely",
  "/game-engine/recipes": "Small examples for movement, input, scoring and more",
  "/game-engine/particles": "Confetti, sparks, explosions and more in one call",
  "/game-engine/input-picking": "Gestures, joystick, keyboard and screen picking",
  "/game-engine/cache-performance": "Asset caching and allocation-free frames",
  "/game-engine/drawing": "Native brushes, layers and in-game painting",
  "/game-engine/api-reference": "Every public export and type, with signatures",
  "/game-engine/first-game": "See how the Car Racing example is built",
  "/game-engine/installation": "Install, configure native builds, serve assets",
  "/game-engine/agent-guide": "The right APIs and checks for coding agents",
};

/**
 * Banner icons where two pages of one section share a sidebar icon (React overrides also apply to the
 * React Native page of the same component). Divider and Breadcrumbs are both
 * a slash, three engine guides are all </>: this keeps neighbouring banners from looking the same.
 */
const ICON_OVERRIDES: Record<string, LucideIcon> = {
  "/react/breadcrumbs": ChevronsRight,
  "/react/divider": SeparatorHorizontal,
  "/react/pagination": Ellipsis,
  "/react/progress": BatteryMedium,
  "/react/switch-group": ToggleLeft,
  "/react/tag-group": Tags,
  "/react/textarea": AlignLeft,
  "/react/toggle-button": MousePointerClick,
  "/game-engine/physics-collisions": Orbit,
  "/game-engine/cache-performance": Zap,
  "/game-engine/world-entities": Globe,
  "/game-engine/solid-modelling": Box,
  "/game-engine/playground": Play,
  "/game-engine/recipes": ChefHat,
  "/game-engine/render-source": Cpu,
  "/game-engine/drawing": Brush,
  "/game-engine/procedural-geometry": Spline,
  "/game-engine/skeletal-animation": Bone,
  "/game-engine/react": Monitor,
  "/game-engine/react-native": Smartphone,
};

/** Titles with a character the banner font (Inter) does not have. */
const TITLE_OVERRIDES: Record<string, string> = {
  "/tools/json-query-string-converter": "JSON to Query String",
};

/** A component name as JSX, for the window tab: "Avatar Group" -> "<AvatarGroup />". */
const jsxTag = (title: string) => `<${title.replace(/[^A-Za-z0-9]/g, "")} />`;

const link = (items: any[]) => items.filter((item) => item.link && !item.isHeading);

export function buildSpecs(): BannerSpec[] {
  const specs: BannerSpec[] = [];
  const add = (spec: BannerSpec) => specs.push(spec);

  const reactComponents = link(reactSidebarItems).filter((item) => item.isComponent);
  const nativeComponents = link(reactNativeSidebarItems).filter((item) => item.isComponent);

  // ---- Site-wide pages ----
  add({
    path: "/",
    eyebrow: "Open source · MIT",
    title: "Build apps and games, faster",
    tagline: `${TOTAL_COMPONENT_COUNT} components, a game engine and ${TOOL_COUNT} tools`,
    theme: THEME.brand,
    visual: { kind: "bento", icons: [LayoutGrid, Atom, Gamepad2, Clapperboard, Wrench, Terminal] },
  });
  add({
    path: "/contributions",
    eyebrow: "Open source",
    title: "Contribute to Nayan UI",
    tagline: "Fix bugs, add features and improve the docs",
    theme: THEME.brand,
    visual: { kind: "code", icon: HeartHandshake, label: "CONTRIBUTING.md" },
  });
  add({
    path: "/tags",
    eyebrow: "Browse",
    title: "Components by Tag",
    tagline: "Find components by use case",
    theme: THEME.brand,
    visual: { kind: "app", icon: Tags, label: "tags" },
  });

  // ---- React ----
  const reactGrid = reactComponents.slice(0, 9).map((item) => item.icon);
  for (const path of ["/react", "/react/components"])
    add({
      path,
      eyebrow: "React",
      title: "React Components",
      tagline: `${REACT_COMPONENT_COUNT} accessible components for the web`,
      theme: THEME.react,
      chip: "@nayan-ui/react",
      visual: { kind: "bento", icons: reactGrid.slice(0, 6) },
    });
  add({
    path: "/react/installation",
    eyebrow: "React · Get started",
    title: "Install Nayan UI for React",
    tagline: "Up and running in a minute",
    theme: THEME.react,
    visual: { kind: "terminal", icon: Download, command: "npm install @nayan-ui/react" },
  });
  add({
    path: "/react/tags",
    eyebrow: "React",
    title: "React Component Tags",
    tagline: "Find components by use case",
    theme: THEME.react,
    visual: { kind: "app", icon: Tag, label: "react/tags" },
  });
  for (const item of reactComponents)
    add({
      path: item.link,
      eyebrow: "React Component",
      title: item.title,
      tagline: COMPONENT_TAGLINES[item.title] ?? missing(item.link),
      theme: THEME.react,
      chip: "@nayan-ui/react",
      visual: { kind: "app", icon: item.icon, label: jsxTag(item.title) },
    });

  // ---- React Native ----
  const nativeGrid = nativeComponents.slice(0, 9).map((item) => item.icon);
  for (const path of ["/react-native", "/react-native/components"])
    add({
      path,
      eyebrow: "React Native",
      title: "React Native Components",
      tagline: `${NATIVE_COMPONENT_COUNT} components for iOS and Android`,
      theme: THEME.native,
      chip: "@nayan-ui/native",
      visual: { kind: "bento", icons: nativeGrid.slice(0, 6) },
    });
  add({
    path: "/react-native/installation",
    eyebrow: "React Native · Get started",
    title: "Install Nayan UI for React Native",
    tagline: "Works with Expo and bare React Native",
    theme: THEME.native,
    visual: { kind: "terminal", icon: Download, command: "npm install @nayan-ui/native" },
  });
  add({
    path: "/react-native/tags",
    eyebrow: "React Native",
    title: "React Native Component Tags",
    tagline: "Find native components by use case",
    theme: THEME.native,
    visual: { kind: "phone", icon: Tag, label: "native/tags" },
  });
  for (const item of nativeComponents)
    add({
      path: item.link,
      eyebrow: "React Native Component",
      title: item.title,
      tagline: COMPONENT_TAGLINES[item.title] ?? missing(item.link),
      theme: THEME.native,
      chip: "@nayan-ui/native",
      visual: { kind: "phone", icon: item.icon, label: jsxTag(item.title) },
    });

  // ---- Tools ----
  let category = "";
  for (const item of toolsSidebarItems as any[]) {
    if (item.isHeading) {
      category = item.title;
      continue;
    }
    if (!item.link) continue;
    if (item.link === "/tools") {
      add({
        path: "/tools",
        eyebrow: "Free · No sign-up",
        title: "Free Developer Tools",
        tagline: `${TOOL_COUNT} tools that run in your browser`,
        theme: THEME.tools,
        visual: { kind: "bento", icons: Object.values(TOOL_CATEGORY).slice(0, 6).map((c) => c.icon) },
      });
      continue;
    }
    const cat = TOOL_CATEGORY[category];
    if (!cat) throw new Error(`No banner style for the tools category "${category}"`);
    add({
      path: item.link,
      eyebrow: cat.label,
      title: item.title,
      tagline: TAGLINE_OVERRIDES[item.link] ?? item.description,
      theme: cat.theme,
      visual: { kind: "browser", icon: item.icon, label: `nayanui.com${item.link}` },
    });
  }

  // ---- Game engine ----
  for (const item of link(engineSidebarItems)) {
    const isHome = item.link === "/game-engine";
    add({
      path: item.link,
      eyebrow: isHome ? "Game Engine" : "Game Engine Guide",
      title: isHome
        ? "Nayan Game Engine"
        : item.title === "Playground"
          ? "Engine Playground"
          : item.title,
      tagline: TAGLINE_OVERRIDES[item.link] ?? item.description,
      theme: THEME.engine,
      chip: "@nayan-ui/engine",
      visual:
        item.link === "/game-engine/installation"
          ? { kind: "terminal", icon: Download, command: "npm install @nayan-ui/engine" }
          : {
              kind: "code",
              icon: isHome ? Atom : item.icon,
              label: isHome ? "game.tsx" : `${item.link.split("/").pop()}.tsx`,
            },
    });
  }

  // ---- Games ----
  const GAMES_DOCS: Record<string, { title: string; tagline: string; icon: LucideIcon }> = {
    "/games/installation": {
      title: "Install the Games",
      tagline: "Set up @nayan-ui/games in React or React Native",
      icon: Download,
    },
    "/games/api-reference": {
      title: "Games API Reference",
      tagline: "Every exported component, constant and type",
      icon: BookOpen,
    },
    "/games/build-a-game": {
      title: "Build an Engine Game",
      tagline: "File pattern, lifecycle and shared helpers",
      icon: Gamepad2,
    },
    "/games/licensing": {
      title: "Games Licensing",
      tagline: "License, commercial use and acknowledgments",
      icon: Scale,
    },
  };
  for (const item of link(gamesSidebarItems)) {
    if (item.link === "/games") {
      add({
        path: "/games",
        eyebrow: "Play free",
        title: `${Math.floor(GAME_COUNT / 10) * 10}+ Free Games`,
        tagline: "Play in the browser, or add one to your app",
        theme: THEME.games,
        chip: "@nayan-ui/games",
        visual: {
          kind: "shots",
          srcs: ["car-racing", "block-blast", "penguin-run"].map((id) => pub(`games/${id}.png`)),
        },
      });
      continue;
    }
    const doc = GAMES_DOCS[item.link];
    if (doc) {
      add({
        path: item.link,
        eyebrow: "Games · Docs",
        ...doc,
        theme: THEME.games,
        chip: "@nayan-ui/games",
        visual:
          item.link === "/games/installation"
            ? { kind: "terminal", icon: doc.icon, command: "npm install @nayan-ui/games" }
            : { kind: "code", icon: doc.icon, label: `${item.link.split("/").pop()}.md` },
      });
      continue;
    }
    const id = item.link.split("/")[2];
    const game = gamesData[id];
    if (!game) throw new Error(`No game data for ${item.link}`);
    add({
      path: item.link,
      eyebrow: `${game.category} Game`,
      title: game.name,
      tagline: item.description,
      theme: THEME.games,
      visual: existsSync(pub(`games/${id}.png`))
        ? { kind: "shot", src: pub(`games/${id}.png`) }
        : { kind: "phone", icon: Gamepad2, label: game.name },
    });
  }

  // ---- Video editor ----
  add({
    path: "/video-editor",
    eyebrow: "Free video editor",
    title: "Edit Video in Your Browser",
    tagline: "No upload, no watermark, up to 4K",
    theme: THEME.video,
    visual: {
      kind: "screen",
      src: pub("video-editor/editor-dark.png"),
      label: "nayanui.com/video-editor",
    },
  });

  for (const spec of specs) {
    spec.title = TITLE_OVERRIDES[spec.path] ?? spec.title;
    const key =
      spec.path in ICON_OVERRIDES ? spec.path : spec.path.replace(/^\/react-native\//, "/react/");
    if (key in ICON_OVERRIDES && "icon" in spec.visual)
      spec.visual = { ...spec.visual, icon: ICON_OVERRIDES[key]! };
  }
  for (const [path, icon] of Object.entries(
    ICON_OVERRIDES as Record<string, LucideIcon | undefined>,
  ))
    if (icon === undefined)
      throw new Error(`The banner icon for ${path} is not a lucide-react export`);
  return specs;
}

function missing(path: string): never {
  throw new Error(`No banner tagline for ${path}: add one to COMPONENT_TAGLINES`);
}
