/*
 * How many of everything there is.
 *
 * Counted from the navigation and the games data rather than written down.
 * The site previously quoted "50+ components" on the home page, "30+" in
 * llm.txt, "50+ games" on a games page listing forty, and "100+
 * Contributors" on a repository with two — because every one of those was a
 * literal somebody typed once. Deriving them means the answer changes when
 * the thing does.
 */
import { GAMES_LIST } from './GamesData';
import { reactNativeSidebarItems, reactSidebarItems } from './Utils';

export const REACT_COMPONENT_COUNT = reactSidebarItems.filter((item: any) => item.isComponent).length;

export const NATIVE_COMPONENT_COUNT = reactNativeSidebarItems.filter((item: any) => item.isComponent).length;

export const TOTAL_COMPONENT_COUNT = REACT_COMPONENT_COUNT + NATIVE_COMPONENT_COUNT;

export const GAME_COUNT = GAMES_LIST.length;

export const GAME_CATEGORY_COUNT = new Set(GAMES_LIST.map(game => game.category)).size;
