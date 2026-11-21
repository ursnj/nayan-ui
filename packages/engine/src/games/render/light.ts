import type { Light } from '../types';

/**
 * A light for flat, front-facing scenes (boards, puzzles, 2D games looking down -z): surfaces facing
 * the camera (+z) are lit at exactly 1, so flat panels show their color unchanged, while rounded
 * shapes keep their shading (lighter toward the light, darker away). Shadows are off.
 *
 * ```tsx
 * <GameView source={world} light={frontLight([-0.45, 0.6, 1], 0.5)} />
 * ```
 */
export function frontLight(direction: [number, number, number], ambient: number): Light {
  const [x, y, z] = direction;
  const facing = z / Math.hypot(x, y, z);
  // Mirrors the renderer's shading: ambient × hemisphere (0.8 for a sideways normal) plus diffuse.
  const k = 1 / (ambient * 0.8 + (1 - ambient) * facing);
  return { direction, ambient, shadows: false, color: [k, k, k] };
}
