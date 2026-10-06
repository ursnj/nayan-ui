import { useEffect, useState } from "react";

export const MIN_APP_WIDTH = 950;

export const useHasRoom = () => {
  const query = `(min-width: ${MIN_APP_WIDTH}px)`;
  const [hasRoom, setHasRoom] = useState(() =>
    typeof window === "undefined" ? true : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setHasRoom(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return hasRoom;
};
