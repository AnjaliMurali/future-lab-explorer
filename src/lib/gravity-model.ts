import type { ParamSpec, Zone } from "./param-lab";

export type GravityGoal = "float" | "earth" | "strength";
export const GRAVITY_GOALS: Record<GravityGoal, { label: string; target: number }> = {
  float: { label: "Low-gravity exploration", target: 1.62 },
  earth: { label: "Earth-like training", target: 9.81 },
  strength: { label: "High-gravity challenge", target: 24.79 },
};

// Impulse is a push accumulated over time, not a force in newtons.
export function gravityMetrics(g: number, mass: number, impulse: number) {
  const speed = impulse / mass;
  return {
    speed,
    jumpHeight: speed ** 2 / (2 * g),
    hangTime: 2 * speed / g,
    fallTime: Math.sqrt(20 / g),
    weight: mass * g,
    period: 2 * Math.PI * Math.sqrt(1.2 / g),
    energy: mass * speed ** 2 / 2,
  };
}

export function gravityScore(goal: GravityGoal, g: number, mass: number, impulse: number) {
  const target = GRAVITY_GOALS[goal].target;
  return Math.round(Math.max(0, 100 - 65 * Math.abs(g - target) / target - Math.abs(mass - 40) / 3 - Math.abs(impulse - 200) / 15));
}

export function gravitySpecs(goal: GravityGoal): ParamSpec[] {
  const zones: Record<GravityGoal, Zone[]> = {
    float: [{ from: 0.5, to: 1, tone: "learn" }, { from: 1, to: 2.5, tone: "optimal" }, { from: 2.5, to: 5, tone: "good" }, { from: 5, to: 15, tone: "learn" }, { from: 15, to: 30, tone: "high" }],
    earth: [{ from: 0.5, to: 3, tone: "low" }, { from: 3, to: 7, tone: "learn" }, { from: 7, to: 9, tone: "good" }, { from: 9, to: 11, tone: "optimal" }, { from: 11, to: 16, tone: "good" }, { from: 16, to: 30, tone: "high" }],
    strength: [{ from: 0.5, to: 8, tone: "low" }, { from: 8, to: 16, tone: "learn" }, { from: 16, to: 22, tone: "good" }, { from: 22, to: 27, tone: "optimal" }, { from: 27, to: 30, tone: "high" }],
  };
  return [
    { key: "g", label: "Gravity strength", icon: "🪐", unit: "m/s²", min: 0.5, max: 30, step: 0.01, zones: zones[goal], suggested: GRAVITY_GOALS[goal].target,
      effect: { up: "The ball falls sooner, the jump is lower and the pendulum swings faster.", down: "The ball falls slowly, the jumper floats longer and the pendulum slows." },
      reason: "Gravity accelerates falling objects and slows an upward jump. Mass does not change this acceleration in a vacuum.", pros: ["Stronger gravity gives more weight", "Lower gravity allows longer jumps"], cons: ["Very strong gravity makes movement harder"],
      chain: { up: ["Gravity ↑", "Downward acceleration ↑", "Jump height ↓", "Weight ↑"], down: ["Gravity ↓", "Slower falling", "Hang time ↑", "Weight ↓"] } },
    { key: "mass", label: "Mass", icon: "⚖️", unit: "kg", min: 10, max: 120, suggested: 40,
      zones: [{ from: 10, to: 20, tone: "learn" }, { from: 20, to: 30, tone: "good" }, { from: 30, to: 50, tone: "optimal" }, { from: 50, to: 85, tone: "good" }, { from: 85, to: 120, tone: "learn" }],
      effect: { up: "The same push produces a lower jump; weight rises, but fall time stays the same.", down: "The same push produces a higher jump; weight falls, but fall time stays the same." },
      reason: "The same impulse gives a heavier explorer less take-off speed. In a vacuum, heavy and light objects fall at the same rate.", pros: ["Compare inertia with weight"], cons: ["The same push cannot lift every mass equally high"],
      chain: { up: ["Mass ↑", "Same impulse", "Take-off speed ↓", "Jump height ↓"], down: ["Mass ↓", "Same impulse", "Take-off speed ↑", "Jump height ↑"] } },
    { key: "impulse", label: "Jump impulse", icon: "🦘", unit: "N·s", min: 50, max: 600, step: 10, suggested: 200,
      zones: [{ from: 50, to: 100, tone: "low" }, { from: 100, to: 150, tone: "learn" }, { from: 150, to: 250, tone: "optimal" }, { from: 250, to: 400, tone: "good" }, { from: 400, to: 600, tone: "high" }],
      effect: { up: "The jumper launches faster, rises higher and spends longer in the air.", down: "The jumper launches gently, rises less and lands sooner." },
      reason: "Impulse is force multiplied by push duration. Take-off speed equals impulse divided by mass, and jump height grows with speed squared.", pros: ["Higher jumps", "More time to observe motion"], cons: ["Large pushes require much more energy"],
      chain: { up: ["Impulse ↑", "Take-off speed ↑", "Jump height ↑↑", "Energy use ↑↑"], down: ["Impulse ↓", "Take-off speed ↓", "Lower jump", "Energy use ↓"] } },
  ];
}