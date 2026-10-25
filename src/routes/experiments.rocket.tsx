import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader } from "@/components/lab/SiteHeader";
import { Panel, Choice, Readout } from "@/components/lab/Panel";
import { ZoneSlider } from "@/components/lab/ZoneSlider";
import {
  BestSettings,
  CompareRuns,
  LiveGraph,
  ModeSwitch,
  ParameterTimeline,
  PredictionCard,
  ResultScorecard,
  ScienceCoach,
  ScienceNote,
  WhatChangedPanel,
} from "@/components/lab/ImpactPanels";
import { useParamLab, useRuns, type LabMode, type ParamSpec, type Zone } from "@/lib/param-lab";

export const Route = createFileRoute("/experiments/rocket")({
  head: () => ({
    meta: [
      { title: "Rocket Launch Simulator — Future Science Lab" },
      {
        name: "description",
        content:
          "Tune thrust, fuel, payload and launch angle, see live altitude and velocity graphs, and discover the best range for each mission.",
      },
      { property: "og:title", content: "Rocket Launch Simulator" },
      {
        property: "og:description",
        content: "Countdown, ignition and orbit — with live telemetry and parameter coaching.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RocketPage,
});

type Phase = "idle" | "countdown" | "ascent" | "done";
type Mission = "suborbital" | "satellite" | "heavy";

const MISSIONS: Record<Mission, { label: string; goal: string; targetAlt: number }> = {
  suborbital: {
    label: "Short atmospheric flight",
    goal: "Reach about 80 km, gather weather data and come home with fuel to spare.",
    targetAlt: 80,
  },
  satellite: {
    label: "Satellite insertion",
    goal: "Place a satellite in orbit at 200 km using as little fuel as possible.",
    targetAlt: 200,
  },
  heavy: {
    label: "Heavy cargo lift",
    goal: "Carry a heavy payload to 200 km — you will need serious thrust.",
    targetAlt: 200,
  },
};

function z(from: number, to: number, tone: Zone["tone"]): Zone {
  return { from, to, tone };
}

function buildSpecs(mission: Mission): ParamSpec[] {
  const thrustZones: Record<Mission, Zone[]> = {
    suborbital: [z(20, 35, "low"), z(35, 50, "learn"), z(50, 65, "optimal"), z(65, 85, "good"), z(85, 100, "high")],
    satellite: [z(20, 45, "low"), z(45, 65, "learn"), z(65, 75, "good"), z(75, 88, "optimal"), z(88, 100, "high")],
    heavy: [z(20, 55, "low"), z(55, 72, "learn"), z(72, 85, "good"), z(85, 97, "optimal"), z(97, 100, "high")],
  };
  const fuelZones: Record<Mission, Zone[]> = {
    suborbital: [z(20, 30, "low"), z(30, 45, "optimal"), z(45, 65, "good"), z(65, 85, "learn"), z(85, 100, "high")],
    satellite: [z(20, 50, "low"), z(50, 70, "learn"), z(70, 82, "good"), z(82, 95, "optimal"), z(95, 100, "high")],
    heavy: [z(20, 60, "low"), z(60, 78, "learn"), z(78, 90, "good"), z(90, 100, "optimal")],
  };
  const payloadZones: Record<Mission, Zone[]> = {
    suborbital: [z(1, 3, "low"), z(3, 10, "optimal"), z(10, 22, "good"), z(22, 40, "learn"), z(40, 60, "high")],
    satellite: [z(1, 5, "learn"), z(5, 15, "optimal"), z(15, 28, "good"), z(28, 45, "learn"), z(45, 60, "high")],
    heavy: [z(1, 25, "learn"), z(25, 38, "good"), z(38, 52, "optimal"), z(52, 60, "high")],
  };
  const angleZones: Record<Mission, Zone[]> = {
    suborbital: [z(45, 60, "low"), z(60, 72, "learn"), z(72, 84, "optimal"), z(84, 90, "good")],
    satellite: [z(45, 62, "low"), z(62, 74, "learn"), z(74, 84, "optimal"), z(84, 90, "good")],
    heavy: [z(45, 68, "low"), z(68, 78, "learn"), z(78, 88, "optimal"), z(88, 90, "good")],
  };
  const sug: Record<Mission, { thrust: number; fuel: number; payload: number; angle: number }> = {
    suborbital: { thrust: 58, fuel: 38, payload: 6, angle: 78 },
    satellite: { thrust: 82, fuel: 88, payload: 10, angle: 80 },
    heavy: { thrust: 93, fuel: 96, payload: 45, angle: 84 },
  };
  const s = sug[mission];

  return [
    {
      key: "thrust",
      label: "Engine power",
      icon: "🔥",
      unit: "%",
      min: 20,
      max: 100,
      zones: thrustZones[mission],
      suggested: s.thrust,
      effect: {
        up: "The engine flame grows, the rocket accelerates faster — but the fuel gauge drains more quickly.",
        down: "The flame shrinks and the climb is gentler, saving fuel but risking a slow, heavy start.",
      },
      reason:
        "More engine power means more thrust, and thrust divided by mass is acceleration. Extra push always costs extra fuel.",
      pros: ["Reaches altitude faster", "Can carry heavier payloads"],
      cons: ["Uses fuel faster", "Wasteful if you overshoot the mission target"],
      chain: {
        up: ["Engine power ↑", "Thrust ↑", "Acceleration ↑", "Fuel burn ↑"],
        down: ["Engine power ↓", "Thrust ↓", "Slower climb", "Fuel lasts longer"],
      },
    },
    {
      key: "fuel",
      label: "Fuel load",
      icon: "⛽",
      unit: "%",
      min: 20,
      max: 100,
      zones: fuelZones[mission],
      suggested: s.fuel,
      effect: {
        up: "The burn lasts longer so the rocket keeps accelerating — but the rocket starts out heavier.",
        down: "The rocket is lighter at lift-off, yet the engines cut out sooner.",
      },
      reason:
        "Fuel is both your energy source and part of your mass. Adding fuel buys burn time, but you must lift that fuel too.",
      pros: ["Longer burn time", "Safety margin for a tough mission"],
      cons: ["Extra mass to lift", "Carrying unused fuel wastes performance"],
      chain: {
        up: ["Fuel load ↑", "Lift-off mass ↑", "Burn time ↑", "Higher altitude possible"],
        down: ["Fuel load ↓", "Rocket lighter", "Burn ends sooner"],
      },
    },
    {
      key: "payload",
      label: "Payload mass",
      icon: "📦",
      unit: "t",
      min: 1,
      max: 60,
      zones: payloadZones[mission],
      suggested: s.payload,
      effect: {
        up: "The rocket gets heavier, accelerates more slowly and needs far more fuel to reach the same height.",
        down: "The rocket lightens and leaps off the pad with the same engines.",
      },
      reason:
        "Acceleration equals force divided by mass, so every extra tonne of cargo steals acceleration from the same thrust.",
      pros: ["Carries more science equipment", "Fewer launches needed"],
      cons: ["Lower acceleration", "Much higher fuel demand"],
      chain: {
        up: ["Payload ↑", "Total mass ↑", "Acceleration ↓", "Altitude ↓"],
        down: ["Payload ↓", "Total mass ↓", "Acceleration ↑"],
      },
    },
    {
      key: "angle",
      label: "Launch angle",
      icon: "📐",
      unit: "°",
      min: 45,
      max: 90,
      zones: angleZones[mission],
      suggested: s.angle,
      effect: {
        up: "The flight path tips upright — more of the speed goes into gaining height.",
        down: "The path leans over — more of the speed goes sideways, covering distance instead of altitude.",
      },
      reason:
        "The launch angle decides how the rocket's velocity is split between going up and going sideways. Orbit needs both.",
      pros: ["Steep angles gain altitude quickly", "Shallow angles build orbital sideways speed"],
      cons: ["Straight up wastes energy fighting gravity", "Too shallow and you never leave the atmosphere"],
      chain: {
        up: ["Angle ↑", "Vertical speed ↑", "Altitude ↑", "Sideways speed ↓"],
        down: ["Angle ↓", "Sideways speed ↑", "Flatter flight path"],
      },
    },
    {
      key: "wind",
      label: "Wind speed",
      icon: "🌬",
      unit: "km/h",
      min: 0,
      max: 80,
      zones: [z(0, 20, "optimal"), z(20, 35, "good"), z(35, 50, "learn"), z(50, 65, "high"), z(65, 80, "high")],
      suggested: 8,
      effect: {
        up: "The rocket is pushed sideways and drag slows the early climb — launch conditions get risky.",
        down: "Calm air means less drag and a cleaner, straighter ascent.",
      },
      reason:
        "Air pushes back on anything moving through it. Strong wind adds sideways force and extra drag low in the atmosphere.",
      pros: ["Practising in wind teaches you about drag"],
      cons: ["Slows the climb", "Real launches are scrubbed in high wind"],
      chain: {
        up: ["Wind ↑", "Drag ↑", "Climb rate ↓", "Mission risk ↑"],
        down: ["Wind ↓", "Drag ↓", "Cleaner ascent"],
      },
    },
  ];
}

function RocketPage() {
  const [mission, setMission] = useState<Mission>("satellite");
  const [mode, setMode] = useState<LabMode>("explore");
  const [thrust, setThrust] = useState(70);
  const [fuel, setFuel] = useState(80);
  const [payload, setPayload] = useState(20);
  const [angle, setAngle] = useState(82);
  const [wind, setWind] = useState(10);
  const [engine, setEngine] = useState<"kerolox" | "hydrolox" | "solid">("kerolox");

  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(5);
  const [tel, setTel] = useState({ alt: 0, vel: 0, fuelLeft: fuel, t: 0, stage: 1 });
  const [track, setTrack] = useState<{ t: number; alt: number; vel: number }[]>([]);
  const [result, setResult] = useState<null | { ok: boolean; text: string }>(null);
  const raf = useRef(0);

  const lab = useParamLab();
  const runs = useRuns();
  const specs = useMemo(() => buildSpecs(mission), [mission]);
  const specOf = (k: string) => {
    const spec = specs.find(s => s.key === k);
    if (!spec) throw new Error(`Unknown parameter: ${k}`);
    return spec;
  };
  const values: Record<string, number> = { thrust, fuel, payload, angle, wind };
  const setters: Record<string, (v: number) => void> = {
    thrust: setThrust,
    fuel: setFuel,
    payload: setPayload,
    angle: setAngle,
    wind: setWind,
  };

  const isp = { kerolox: 300, hydrolox: 440, solid: 250 }[engine];
  const target = MISSIONS[mission].targetAlt;

  // Live predicted performance (updates instantly as sliders move)
  const mass0 = 40 + payload;
  const accel0 = ((thrust / 100) * (isp / 300) * 260) / mass0 - 9.81;
  const burnRate = (thrust / 100) * 11;
  const burnTime = fuel / Math.max(0.1, burnRate);
  const predictedAlt = Math.max(
    0,
    Math.round(
      ((0.5 * Math.max(0, accel0) * burnTime * burnTime * Math.sin((angle * Math.PI) / 180)) / 10) *
        (1 - wind / 400),
    ),
  );
  const successChance = Math.max(
    2,
    Math.min(99, Math.round(100 - Math.abs(predictedAlt - target) / (target / 55))),
  );
  const efficiency = Math.max(
    5,
    Math.min(100, Math.round(100 - Math.abs(predictedAlt - target) / 4 - (fuel - 40) / 4)),
  );

  const thrustCurve = useMemo(
    () =>
      Array.from({ length: 17 }, (_, i) => {
        const th = 20 + i * 5;
        const a = ((th / 100) * (isp / 300) * 260) / mass0 - 9.81;
        const bt = fuel / Math.max(0.1, (th / 100) * 11);
        return {
          x: th,
          y: Math.max(0, Math.round((0.5 * Math.max(0, a) * bt * bt * Math.sin((angle * Math.PI) / 180)) / 10)),
        };
      }),
    [isp, mass0, fuel, angle],
  );
  const fuelCurve = useMemo(
    () =>
      Array.from({ length: 17 }, (_, i) => {
        const f = 20 + i * 5;
        const bt = f / Math.max(0.1, burnRate);
        return { x: f, y: Math.round(bt * 10) / 10 };
      }),
    [burnRate],
  );

  const reset = () => {
    cancelAnimationFrame(raf.current);
    setPhase("idle");
    setCount(5);
    setResult(null);
    setTrack([]);
    setTel({ alt: 0, vel: 0, fuelLeft: fuel, t: 0, stage: 1 });
  };

  const launch = () => {
    setResult(null);
    setTrack([]);
    setPhase("countdown");
    setCount(5);
  };

  useEffect(() => {
    if (phase !== "countdown") return;
    const id = setTimeout(() => {
      if (count <= 1) setPhase("ascent");
      else setCount((c) => c - 1);
    }, 700);
    return () => clearTimeout(id);
  }, [phase, count]);

  useEffect(() => {
    if (phase !== "ascent") return;
    let alt = 0;
    let vel = 0;
    let fuelLeft = fuel;
    let t = 0;
    let stage = 1;
    const m0 = 40 + payload;
    const points: { t: number; alt: number; vel: number }[] = [];

    const step = () => {
      const dt = 0.08;
      t += dt;
      const burning = fuelLeft > 0;
      if (burning) fuelLeft = Math.max(0, fuelLeft - (thrust / 100) * 1.1 * dt * 10);
      if (stage === 1 && fuelLeft < fuel * 0.45) stage = 2;

      const mass = m0 * (0.35 + (fuelLeft / 100) * 0.65) * (stage === 2 ? 0.7 : 1);
      const accel = burning ? ((thrust / 100) * (isp / 300) * 260) / mass - 9.81 : -9.81;
      const drag = alt < 60 ? (wind / 100) * 1.2 : 0;
      vel = Math.max(-400, vel + (accel - drag) * dt);
      alt = Math.max(0, alt + (vel * dt * Math.sin((angle * Math.PI) / 180)) / 10);

      setTel({
        alt: Math.round(alt),
        vel: Math.round(vel * 10) / 10,
        fuelLeft: Math.round(fuelLeft),
        t: Math.round(t * 10) / 10,
        stage,
      });
      if (points.length === 0 || t - (points[points.length - 1]?.t ?? 0) > 0.3) {
        points.push({ t: Math.round(t * 10) / 10, alt: Math.round(alt), vel: Math.round(vel) });
        setTrack([...points]);
      }

      if (alt >= target && vel > 0) {
        setPhase("done");
        setResult({
          ok: true,
          text: `Target reached at ${Math.round(alt)} km with ${Math.round(fuelLeft)}% fuel remaining.`,
        });
        return;
      }
      if ((alt <= 0 && t > 2) || t > 90) {
        setPhase("done");
        setResult({
          ok: false,
          text:
            fuelLeft <= 0
              ? "Fuel exhausted before the target altitude — the rocket fell back to Earth."
              : "The vehicle never built enough vertical speed to reach the target.",
        });
        return;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [phase, thrust, fuel, payload, angle, wind, isp, target]);

  const altPct = Math.min(100, (tel.alt / target) * 100);
  const flameScale = 0.6 + (thrust / 100) * 1.6;
  const stars = Math.max(1, Math.min(5, Math.round(successChance / 20)));
  const shown = lab.selected ?? lab.last;
  const lastSpec = specs.find(s => s.key === shown?.key);

  const coach =
    predictedAlt > target * 1.3
      ? {
          observation: "Your rocket will fly far higher than this mission needs.",
          why: "Extra thrust and fuel are being burned for altitude the mission never asked for.",
          suggestion: `Try reducing engine power towards ${specOf("thrust").suggested}% and compare fuel left at the end.`,
          question: "Why is overshooting the target still counted as an inefficient mission?",
        }
      : predictedAlt < target * 0.7
        ? {
            observation: "Right now your rocket will not reach the target altitude.",
            why: "The thrust-to-mass ratio is too small, or the engines cut out before the climb finishes.",
            suggestion: `Raise engine power towards ${specOf("thrust").suggested}%, or drop some payload.`,
            question: "Would more fuel or less cargo help more here — and why?",
          }
        : {
            observation: "Nice setup — your rocket should hit the target with fuel to spare.",
            why: "Your thrust, mass and burn time are balanced for this mission profile.",
            suggestion: "Save this run, then change only the launch angle and compare the flight paths.",
            question: "Why does a slightly tilted launch help a satellite more than going straight up?",
          };

  const currentSnapshot = () => ({
    params: [
      { label: "Engine power", value: `${thrust}%` },
      { label: "Fuel load", value: `${fuel}%` },
      { label: "Payload", value: `${payload} t` },
      { label: "Launch angle", value: `${angle}°` },
      { label: "Engine", value: engine },
    ],
    metrics: [
      { label: "Predicted altitude", value: `${predictedAlt} km`, numeric: predictedAlt },
      { label: "Success chance", value: `${successChance}%`, numeric: successChance },
      { label: "Mission efficiency", value: `${efficiency}%`, numeric: efficiency },
      { label: "Burn time", value: `${burnTime.toFixed(1)} s`, numeric: Math.round(burnTime * 10) / 10 },
    ],
  });

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <p className="font-display text-xs tracking-[0.4em] text-primary uppercase">Space Lab</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Rocket Launch Simulator</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          A rocket must push harder than gravity pulls. Every slider changes the flame, the climb
          and the fuel gauge instantly — the best values depend on the mission you pick.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-4">
            <Panel eyebrow="Mission objective" title={MISSIONS[mission].label}>
              <Choice
                label="Choose your mission — it changes the best values"
                value={mission}
                onChange={(v) => setMission(v)}
                options={(Object.keys(MISSIONS) as Mission[]).map((k) => ({
                  value: k,
                  label: MISSIONS[k].label,
                }))}
              />
              <p className="mt-3 text-sm text-muted-foreground">{MISSIONS[mission].goal}</p>
            </Panel>

            <Panel eyebrow="Flight console" title="Vehicle setup">
              <div className="space-y-5">
                <Choice
                  label="Engine / fuel"
                  value={engine}
                  onChange={(v) => {
                    lab.recordChoice({
                      key: "engine",
                      label: "Engine type",
                      icon: "🛠",
                      from: engine,
                      to: v,
                      effect:
                        v === "hydrolox"
                          ? "Each kilogram of fuel now produces much more push."
                          : v === "solid"
                            ? "Huge instant power, but far less push per kilogram of fuel."
                            : "A balanced engine with solid push per kilogram of fuel.",
                      reason:
                        "Specific impulse measures how much push an engine gets from each kilogram of fuel — higher means more efficient.",
                      chain: ["Engine changed", "Specific impulse changes", "Fuel efficiency changes", "Altitude changes"],
                    });
                    setEngine(v);
                  }}
                  options={[
                    { value: "kerolox", label: "Kerosene + LOX" },
                    { value: "hydrolox", label: "Hydrogen + LOX" },
                    { value: "solid", label: "Solid booster" },
                  ]}
                />
                {specs.map((s) => (
                  <ZoneSlider
                    key={s.key}
                    spec={s}
                    value={values[s.key] ?? s.suggested}
                    onChange={v => setters[s.key]?.(v)}
                    onCommit={(from, to) => lab.record(s, from, to)}
                  />
                ))}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={launch}
                    disabled={phase === "countdown" || phase === "ascent"}
                    className="flex-1 rounded-full bg-primary px-4 py-2 font-display text-xs tracking-widest text-primary-foreground uppercase neon-ring disabled:opacity-50"
                  >
                    Launch
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-full border border-border px-4 py-2 font-display text-xs tracking-widest uppercase"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </Panel>

            <ModeSwitch
              mode={mode}
              onChange={setMode}
              challenge="Mission: reach the target altitude using the least fuel you can — finish with over 20% in the tank."
            />
          </div>

          <div className="space-y-4">
            <Panel
              eyebrow="Live simulation"
              title={
                phase === "countdown"
                  ? `T-minus ${count}`
                  : phase === "ascent"
                    ? `Stage ${tel.stage} · Ascent`
                    : phase === "done"
                      ? result?.ok
                        ? "Mission success"
                        : "Mission failure"
                      : "Awaiting launch"
              }
              right={
                <span className="text-xs text-muted-foreground">
                  Success chance{" "}
                  <span
                    className="font-display"
                    style={{
                      color:
                        successChance > 70
                          ? "var(--bio)"
                          : successChance > 40
                            ? "var(--primary)"
                            : "var(--magma)",
                    }}
                  >
                    {successChance}%
                  </span>
                </span>
              }
            >
              <div className="relative h-[380px] overflow-hidden rounded-xl bg-gradient-to-b from-[oklch(0.1_0.05_270)] via-[oklch(0.18_0.06_265)] to-[oklch(0.3_0.07_250)] hud-grid">
                {Array.from({ length: 40 }).map((_, i) => (
                  <span
                    key={i}
                    className="absolute h-0.5 w-0.5 rounded-full bg-white/70"
                    style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 70}%` }}
                  />
                ))}
                <div
                  className="absolute left-1/2 transition-[bottom,transform] duration-100"
                  style={{
                    bottom: `${8 + altPct * 0.8}%`,
                    transform: `translateX(-50%) rotate(${90 - angle}deg)`,
                  }}
                >
                  <div className="text-3xl" aria-hidden="true">
                    🚀
                  </div>
                  {(phase === "ascent" || phase === "countdown") && tel.fuelLeft > 0 && (
                    <div
                      className="mx-auto w-2 rounded-full bg-gradient-to-b from-magma to-transparent blur-[1px] animate-pulse-glow"
                      style={{ height: `${18 * flameScale}px` }}
                    />
                  )}
                </div>
                <div
                  className="absolute inset-x-0 border-t border-dashed border-primary/60 text-[0.6rem] text-primary"
                  style={{ bottom: "88%" }}
                >
                  target {target} km
                </div>
                <div className="absolute inset-x-0 bottom-0 h-8 bg-[oklch(0.25_0.05_150)]" />
                {/* Fuel gauge */}
                <div className="absolute top-3 right-3 w-28 rounded-lg border border-border bg-background/60 p-2 text-[0.65rem]">
                  <p className="text-muted-foreground">Fuel</p>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-magma transition-[width] duration-150"
                      style={{ width: `${Math.max(0, tel.fuelLeft)}%` }}
                    />
                  </div>
                </div>
                {wind > 45 && (
                  <p className="absolute top-3 left-3 rounded-full border border-magma bg-magma/20 px-2 py-0.5 text-[0.65rem] text-magma">
                    ⚠️ High wind — launch risk
                  </p>
                )}
              </div>
            </Panel>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Readout label="Altitude" value={`${tel.alt} km`} />
              <Readout label="Velocity" value={`${tel.vel} idx`} tone="accent" />
              <Readout label="Fuel left" value={`${tel.fuelLeft}%`} tone="magma" />
              <Readout label="Mission efficiency" value={`${efficiency}%`} tone="bio" />
            </div>

            <Panel eyebrow="Live scientific graphs" title="Watch the relationship">
              <div className="grid gap-3 md:grid-cols-2">
                <LiveGraph
                  title="Flight profile"
                  xLabel="time (s)"
                  yLabel="altitude (km)"
                  points={
                    track.length > 1
                      ? track.map((p) => ({ x: p.t, y: p.alt }))
                      : [
                          { x: 0, y: 0 },
                          { x: 1, y: 0 },
                        ]
                  }
                />
                <LiveGraph
                  title="Velocity over time"
                  xLabel="time (s)"
                  yLabel="velocity (idx)"
                  points={
                    track.length > 1
                      ? track.map((p) => ({ x: p.t, y: p.vel }))
                      : [
                          { x: 0, y: 0 },
                          { x: 1, y: 0 },
                        ]
                  }
                  color="var(--accent)"
                />
                <LiveGraph
                  title="Thrust → altitude"
                  xLabel="engine power (%)"
                  yLabel="predicted altitude (km)"
                  points={thrustCurve}
                  marker={{ x: thrust, y: predictedAlt }}
                  color="var(--magma)"
                />
                <LiveGraph
                  title="Fuel → burn time"
                  xLabel="fuel load (%)"
                  yLabel="burn time (s)"
                  points={fuelCurve}
                  marker={{ x: fuel, y: Math.round(burnTime * 10) / 10 }}
                  color="var(--bio)"
                />
              </div>
            </Panel>

            <WhatChangedPanel
              event={shown}
              spec={lastSpec}
              currentValue={lastSpec ? values[lastSpec.key] : undefined}
            />

            {shown && (
              <ScienceNote
                title="🚀 Why did the flight change?"
                body={shown.reason}
                tryThis={`Launch now, then set ${shown.label} back to ${shown.from}${shown.unit ? ` ${shown.unit}` : ""} and compare the two flight profiles.`}
              />
            )}

            <PredictionCard
              question="You raise engine power from 70% to 90% while keeping everything else the same. What happens?"
              options={[
                "It accelerates faster but burns fuel quicker",
                "It accelerates faster and uses less fuel",
                "Nothing changes until launch",
                "The rocket becomes lighter",
              ]}
              correct={0}
              explanation="More power means more thrust and more acceleration, but the engines swallow propellant faster — so the burn ends sooner."
            />

            {mode !== "explore" && <ScienceCoach {...coach} muted={mode === "challenge"} />}

            <ResultScorecard
              stars={stars}
              rows={[
                { label: "Predicted altitude", value: `${predictedAlt} km (target ${target})` },
                { label: "Success chance", value: `${successChance}%` },
                { label: "Mission efficiency", value: `${efficiency}%` },
                { label: "Fuel remaining", value: `${tel.fuelLeft}%` },
              ]}
              overall={
                result
                  ? result.ok
                    ? "Mission success — great flying!"
                    : "Mission failed — but every failed launch teaches engineers something."
                  : successChance > 70
                    ? "Looking good — press Launch."
                    : "Adjust your setup before launching."
              }
              didWell={`You paired a ${engine} engine with ${thrust}% power and ${fuel}% fuel for a ${payload} t payload.`}
              improve={
                predictedAlt > target * 1.2
                  ? "You are overshooting the target, which wastes fuel."
                  : predictedAlt < target * 0.8
                    ? "You are falling short of the target altitude."
                    : "Your launch angle could be tuned a little closer to the recommended range."
              }
              tryNext={`Run it again with engine power near ${specOf("thrust").suggested}% and compare fuel remaining.`}
            />

            <BestSettings
              hasAttempt={runs.runs.length > 0 || result !== null}
              specs={specs}
              values={values}
              onApplyAll={() =>
                specs.forEach((s) => {
                  lab.record(s, values[s.key] ?? s.suggested, s.suggested);
                  setters[s.key]?.(s.suggested);
                })
              }
              onApplyOne={(key) => {
                const s = specOf(key);
                lab.record(s, values[key] ?? s.suggested, s.suggested);
                setters[key](s.suggested);
              }}
              expectedImprovement="Around 10–20% better mission efficiency in this simulation model."
              why={`For "${MISSIONS[mission].label}" this combination reaches ${target} km with the smallest sensible fuel load — a different mission would need a different mix.`}
            />

            <CompareRuns
              current={currentSnapshot()}
              runs={runs.runs}
              onSave={() => runs.save(currentSnapshot())}
              onClear={runs.clear}
            />

            <ParameterTimeline
              history={lab.history}
              onReplay={id => {
                const event = lab.history.find(e => e.id === id);
                if (!event) return;
                if (typeof event.to === "number") setters[event.key]?.(event.to);
                if (event.key === "engine" && (event.to === "kerolox" || event.to === "hydrolox" || event.to === "solid")) setEngine(event.to);
                lab.replay(id);
              }}
              activeId={lab.selected?.id ?? null}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
