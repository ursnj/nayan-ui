import { Platform, StatusBar } from "react-native";

/** Space the status bar / notch takes at the top (this example has no safe-area dependency). */
export const SAFE_TOP = Platform.OS === "ios" ? 54 : (StatusBar.currentHeight ?? 24);

/** A game screen's header bar, Playtura style: status bar space plus the bar itself. */
export const HEADER_HEIGHT = SAFE_TOP + 52;
