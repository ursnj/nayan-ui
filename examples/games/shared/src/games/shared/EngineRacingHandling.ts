/** Responsive lane targeting with filtered input and an analytically damped movement curve. */
export type SteeringState = { d: number; target: number; lateral: number; steeringGoal?: number };
export function stepSteering(state: SteeringState, goal: number, dt: number, maxSpeed = 9, response = 10.5, playing = true) {
  if (dt <= 0) return;
  if (!playing) {
    const stopped = state.lateral * Math.exp(-response * 2 * dt);
    state.d += (state.lateral - stopped) / (response * 2);
    state.lateral = stopped;
    state.steeringGoal = state.d;
    return;
  }
  let filtered = state.steeringGoal ?? state.d;
  let remaining = dt;
  // Small input-filter steps keep keyboard, pointer and irregular display frames consistent.
  // Position/velocity use the closed-form critically damped solution rather than Euler correction.
  while (remaining > 1e-9) {
    const h = Math.min(remaining, 1 / 240);
    filtered = goal + (filtered - goal) * Math.exp(-22 * h);
    const error = state.d - filtered;
    const coefficient = state.lateral + response * error;
    const decay = Math.exp(-response * h);
    let position = filtered + (error + coefficient * h) * decay;
    let velocity = (state.lateral - response * coefficient * h) * decay;
    if (Math.abs(velocity) > maxSpeed) {
      velocity = Math.sign(velocity) * maxSpeed;
      position = state.d + (state.lateral + velocity) * 0.5 * h;
    }
    state.d = position;
    state.lateral = velocity;
    remaining -= h;
  }
  state.steeringGoal = filtered;
}

/** Closing speed across the road: moving away or travelling alongside does not trigger a wreck. */
export function sideImpactSpeed(playerLateral: number, trafficLateral: number, offset: number) {
  return Math.max(0, (playerLateral - trafficLateral) * (Math.sign(offset) || 1));
}

/** Ease the displayed yaw and lean independently so quick input changes do not snap the body. */
export function smoothSteeringPose(pose: { yaw: number; roll: number }, lateral: number, speed: number, dt: number) {
  const blend = 1 - Math.exp(-Math.max(0, dt) * 18);
  const yaw = Math.max(-0.22, Math.min(0.22, Math.atan2(lateral, Math.max(8, speed)) * 0.55));
  const roll = Math.max(-0.035, Math.min(0.035, lateral * 0.004));
  const yawStep = (yaw - pose.yaw) * blend;
  pose.yaw += Math.max(-0.9 * dt, Math.min(0.9 * dt, yawStep));
  pose.roll += (roll - pose.roll) * blend;
}
