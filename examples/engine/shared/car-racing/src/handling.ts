/** Playtura games-app Car Racing steering, shared by keyboard and drag input. */
export type SteeringState = { d: number; target: number; lateral: number };
export function stepSteering(
  state: SteeringState,
  goal: number,
  dt: number,
  maxSpeed = 15,
  response = 9,
  playing = true,
) {
  const wanted = playing ? Math.max(-maxSpeed, Math.min(maxSpeed, (goal - state.d) * 6)) : 0;
  state.lateral += (wanted - state.lateral) * (1 - Math.exp(-Math.max(0, dt) * response));
  state.d += state.lateral * Math.max(0, dt);
}

/** Closing speed across the road: moving away or travelling alongside does not trigger a wreck. */
export function sideImpactSpeed(playerLateral: number, trafficLateral: number, offset: number) {
  return Math.max(0, (playerLateral - trafficLateral) * (Math.sign(offset) || 1));
}
