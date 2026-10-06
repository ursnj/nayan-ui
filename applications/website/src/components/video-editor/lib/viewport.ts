import { useEffect, useState } from "react";

/**
 * Below this the three-column layout (library / preview / inspector) has
 * nowhere left to shrink; see `SmallScreenNotice`.
 */
export const MIN_APP_WIDTH = 1024;

const getWidth = () => (typeof window === "undefined" ? MIN_APP_WIDTH : window.innerWidth);

/** Whether the window is wide enough to host the editor. SSR-safe (assumes yes until measured). */
export const useHasRoom = (): boolean => {
  const [width, setWidth] = useState(getWidth);

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return width >= MIN_APP_WIDTH;
};
