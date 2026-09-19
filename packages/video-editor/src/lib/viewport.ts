import { useEffect, useState } from 'react';

/**
 * Narrowest window the editor can actually be used in.
 *
 * This is not a round number picked for taste. The three columns have hard
 * floors before the timeline gets a single pixel: 184px of sticky track
 * headers, a 220px minimum library and a 240px minimum inspector. Below about
 * a thousand pixels the layout does not degrade, it stops working — so the
 * honest thing is to say so rather than render something unusable.
 */
export const MIN_APP_WIDTH = 950;

/** True while the viewport is wide enough for the editor. */
export const useHasRoom = () => {
  const query = `(min-width: ${MIN_APP_WIDTH}px)`;
  // Seeded from the real value so the editor never flashes the notice on a
  // desktop, and the notice never flashes the editor on a phone.
  const [hasRoom, setHasRoom] = useState(() => (typeof window === 'undefined' ? true : window.matchMedia(query).matches));

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setHasRoom(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return hasRoom;
};
