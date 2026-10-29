/** Playtura-style steering with a slightly softer entry, shared by keyboard and drag input. */
export type SteeringState = { d: number; target: number; lateral: number };
export function stepSteering(
  state: SteeringState,
  goal: number,
  dt: number,
  maxSpeed = 15,
  response = 8.5,
  playing = true,
) {
  const wanted = playing ? Math.max(-maxSpeed, Math.min(maxSpeed, (goal - state.d) * 5.5)) : 0;
  state.lateral += (wanted - state.lateral) * (1 - Math.exp(-Math.max(0, dt) * response));
  state.d += state.lateral * Math.max(0, dt);
}

/** Closing speed across the road: moving away or travelling alongside does not trigger a wreck. */
export function sideImpactSpeed(playerLateral: number, trafficLateral: number, offset: number) {
  return Math.max(0, (playerLateral - trafficLateral) * (Math.sign(offset) || 1));
}

/** Ease the displayed yaw and lean independently so quick input changes do not snap the body. */
export function smoothSteeringPose(
  pose: { yaw: number; roll: number },
  lateral: number,
  speed: number,
  dt: number,
) {
  const blend = 1 - Math.exp(-Math.max(0, dt) * 18);
  const yaw = Math.atan2(lateral, Math.max(8, speed)) * 0.9;
  const roll = Math.max(-0.06, Math.min(0.06, lateral * 0.006));
  pose.yaw += (yaw - pose.yaw) * blend;
  pose.roll += (roll - pose.roll) * blend;
}
