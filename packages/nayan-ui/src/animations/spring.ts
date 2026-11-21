import type { ViewAnimationConfig } from './view';

/** A unit step response with zero initial velocity, normalized to land at the requested time. */
export function springCurve(spring: NonNullable<ViewAnimationConfig['spring']>, duration: number) {
  const frequency = Math.sqrt(spring.stiffness / spring.mass);
  const friction = spring.damping / (2 * spring.mass);
  const discriminant = frequency * frequency - friction * friction;
  const rate = Math.sqrt(Math.abs(discriminant));
  const seconds = duration / 1000;
  function response(progress: number): number {
    const t = progress * seconds;
    if (rate < frequency * 1e-6) return 1 - Math.exp(-friction * t) * (1 + friction * t);
    if (discriminant > 0) return 1 - Math.exp(-friction * t) * (Math.cos(rate * t) + (friction / rate) * Math.sin(rate * t));
    // The slow root uses a quotient to avoid cancellation for heavy damping.
    const slow = (-frequency * frequency) / (friction + rate);
    const fast = -(friction + rate);
    return 1 - (fast * Math.exp(slow * t) - slow * Math.exp(fast * t)) / (fast - slow);
  }
  const end = response(1);
  if (!Number.isFinite(end) || end < 1e-6) return (progress: number) => progress;
  return (progress: number) => (progress <= 0 || progress >= 1 ? progress : response(progress) / end);
}

export function browserSpring(spring: NonNullable<ViewAnimationConfig['spring']>, duration: number): string {
  const curve = springCurve(spring, duration);
  const frames = Math.min(120, Math.max(2, Math.ceil(duration * 0.06)));
  return `linear(${Array.from({ length: frames + 1 }, (_, frame) => curve(frame / frames).toFixed(5)).join(',')})`;
}
