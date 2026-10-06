import { GAMES_LIST } from "./GamesData";
import { reactNativeSidebarItems, reactSidebarItems, toolsSidebarItems } from "./Utils";

export const REACT_COMPONENT_COUNT = reactSidebarItems.filter(
  (item: any) => item.isComponent,
).length;

export const NATIVE_COMPONENT_COUNT = reactNativeSidebarItems.filter(
  (item: any) => item.isComponent,
).length;

export const TOTAL_COMPONENT_COUNT = REACT_COMPONENT_COUNT + NATIVE_COMPONENT_COUNT;

export const GAME_COUNT = GAMES_LIST.length;

export const GAME_CATEGORY_COUNT = new Set(GAMES_LIST.map((game) => game.category)).size;

export const TOOL_COUNT = toolsSidebarItems.filter((item: any) => item.tags).length;
