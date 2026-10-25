import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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

export const Route = createFileRoute("/experiments/turbine")({
  head: () => ({
    meta: [
      { title: "Wind Turbine Builder — Future Science Lab" },
      {
        name: "description",
        content:
          "Design blades, angles, towers and generators, watch live power graphs and find the best range for your energy mission.",
      },
      { property: "og:title", content: "Wind Turbine Builder" },
      {
        property: "og:description",
        content: "Engineer a turbine and see exactly why each change helps or hurts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TurbinePage,
});

type Shape = "flat" | "curved" | "twisted";
type Goal = "village" | "maxpower" | "efficiency";

const GOALS: Record<Goal, { label: string; goal: string }> = {
  village: { label: "Power a small village", goal: "Reach about 500 kW cheaply and reliably." },
  maxpower: { label: "Maximum power", goal: "Generate as much electricity as the site allows." },
  efficiency: {
    label: "Best efficiency",
    goal: "Capture the largest share of the wind's energy, not the largest total.",
  },
};

function z(from: number, to: number, tone: Zone["tone"]): Zone {
  return { from, to, tone };
}

function buildSpecs(goal: Goal): ParamSpec[] {
  const bladeZones: Record<Goal, Zone[]> = {
    village: [z(5, 12, "low"), z(12, 22, "optimal"), z(22, 45, "good"), z(45, 80, "learn"), z(80, 110, "high")],
    maxpower: [z(5, 30, "low"), z(30, 55, "learn"), z(55, 80, "good"), z(80, 105, "optimal"), z(105, 110, "high")],
    efficiency: [z(5, 15, "low"), z(15, 35, "good"), z(35, 65, "optimal"), z(65, 95, "learn"), z(95, 110, "high")],
  };
  const angleZones: Zone[] = [
    z(0, 8, "low"),
    z(8, 18, "learn"),
    z(18, 25, "good"),
    z(25, 35, "optimal"),
    z(35, 50, "learn"),
    z(50, 80, "high"),
  ];
  const windZones: Zone[] = [
    z(1, 4, "low"),
    z(4, 8, "learn"),
    z(8, 12, "good"),
    z(12, 18, "optimal"),
    z(18, 22, "learn"),
    z(22, 25, "high"),
  ];
  const genZones: Record<Goal, Zone[]> = {
    village: [z(100, 300, "learn"), z(300, 700, "optimal"), z(700, 1500, "good"), z(1500, 4000, "learn"), z(4000, 8000, "high")],
    maxpower: [z(100, 1500, "low"), z(1500, 3000, "learn"), z(3000, 5000, "good"), z(5000, 7500, "optimal"), z(7500, 8000, "high")],
    efficiency: [z(100, 800, "low"), z(800, 2000, "good"), z(2000, 4500, "optimal"), z(4500, 6500, "learn"), z(6500, 8000, "high")],
  };
  const towerZones: Zone[] = [
    z(10, 30, "low"),
    z(30, 60, "learn"),
    z(60, 90, "good"),
    z(90, 140, "optimal"),
    z(140, 170, "learn"),
    z(170, 180, "high"),
  ];
  const sug: Record<Goal, { blade: number; angle: number; wind: number; gen: number; tower: number }> = {
    village: { blade: 18, angle: 30, wind: 12, gen: 500, tower: 100 },
    maxpower: { blade: 95, angle: 30, wind: 15, gen: 6500, tower: 130 },
    efficiency: { blade: 50, angle: 30, wind: 13, gen: 3500, tower: 120 },
  };
  const s = sug[goal];

  return [
    {
      key: "blade",
      label: "Blade length",
      icon: "🪶",
      unit: "m",
      min: 5,
      max: 110,
      zones: bladeZones[goal],
      suggested: s.blade,
      effect: {
        up: "The rotor sweeps a much bigger circle of air, and the power meter jumps.",
        down: "The swept circle shrinks and the turbine catches far less wind.",
      },
      reason:
        "Power depends on the area the blades sweep. Doubling blade length gives four times the area, so four times the wind energy.",
      pros: ["Much more power from the same wind", "Works better at low wind speeds"],
      cons: ["Heavy and expensive", "Long blades spin slowly and stress the tower"],
      chain: {
        up: ["Blade length ↑", "Swept area ↑↑", "Wind captured ↑", "Power ↑"],
        down: ["Blade length ↓", "Swept area ↓", "Power ↓"],
      },
    },
    {
      key: "angle",
      label: "Blade angle (pitch)",
      icon: "📐",
      unit: "°",
      min: 0,
      max: 80,
      zones: angleZones,
      suggested: s.angle,
      effect: {
        up: "The blades turn edge-on to the wind — they spin easily but grab far less energy.",
        down: "The blades face the wind flat-on, catching more push but stalling the airflow.",
      },
      reason:
        "The blade angle decides how well moving air transfers its energy to the blade. Too flat or too edge-on and most of the wind slips past.",
      pros: ["A well-set angle maximises energy transfer", "Steeper angles protect the turbine in storms"],
      cons: ["Wrong angle spins fast but makes little electricity", "Very flat blades stall in strong wind"],
      chain: {
        up: ["Angle ↑", "Less wind force captured", "Lift ↓", "Power ↓"],
        down: ["Angle ↓", "Blade faces the wind", "Airflow stalls", "Efficiency ↓"],
      },
    },
    {
      key: "windSpeed",
      label: "Wind speed",
      icon: "🌬",
      unit: "m/s",
      min: 1,
      max: 25,
      zones: windZones,
      suggested: s.wind,
      effect: {
        up: "The rotor spins visibly faster and the power output rockets upward.",
        down: "The rotor slows and power collapses much faster than you might expect.",
      },
      reason:
        "Wind power grows with the cube of the speed: doubling the wind gives eight times the energy.",
      pros: ["Huge power gains", "Fewer turbines needed at windy sites"],
      cons: ["Above about 22 m/s real turbines shut down for safety"],
      chain: {
        up: ["Wind speed ↑", "Energy in air ↑↑↑", "Rotor speed ↑", "Power ↑↑↑"],
        down: ["Wind speed ↓", "Energy in air ↓↓↓", "Power collapses"],
      },
    },
    {
      key: "generator",
      label: "Generator size",
      icon: "⚡",
      unit: "kW",
      min: 100,
      max: 8000,
      step: 100,
      zones: genZones[goal],
      suggested: s.gen,
      effect: {
        up: "The rated ceiling rises, so the turbine can deliver everything the blades capture.",
        down: "The generator caps the output — energy the blades collect is simply thrown away.",
      },
      reason:
        "The generator turns spinning motion into electricity, but it can only handle so much before it hits its rated limit.",
      pros: ["No wasted energy on windy days", "Higher peak output"],
      cons: ["A generator that is too big is expensive and rarely full"],
      chain: {
        up: ["Generator size ↑", "Rated ceiling ↑", "Less capping", "Usable power ↑"],
        down: ["Generator size ↓", "Output capped", "Captured energy wasted"],
      },
    },
    {
      key: "tower",
      label: "Tower height",
      icon: "🗼",
      unit: "m",
      min: 10,
      max: 180,
      step: 5,
      zones: towerZones,
      suggested: s.tower,
      effect: {
        up: "The rotor climbs into faster, smoother air, so output rises without touching the blades.",
        down: "The rotor drops into slow, gusty air near the ground and power falls.",
      },
      reason:
        "Friction with the ground slows the wind. Higher up, the wind is faster and steadier — this is called wind shear.",
      pros: ["Free extra wind speed", "Less turbulence and wear"],
      cons: ["Tall towers cost more and are harder to build"],
      chain: {
        up: ["Tower height ↑", "Hub wind speed ↑", "Power ↑"],
        down: ["Tower height ↓", "Ground drag ↑", "Hub wind ↓", "Power ↓"],
      },
    },
  ];
}

function TurbinePage() {
  const [goal, setGoal] = useState<Goal>("village");
  const [mode, setMode] = useState<LabMode>("explore");
  const [blade, setBlade] = useState(35);
  const [angle, setAngle] = useState(45);
  const [shape, setShape] = useState<Shape>("curved");
  const [windSpeed, setWindSpeed] = useState(10);
  const [generator, setGenerator] = useState(2000);
  const [tower, setTower] = useState(80);

  const lab = useParamLab();
  const runs = useRuns();
  const specs = useMemo(() => buildSpecs(goal), [goal]);
  const specOf = (k: string) => {
    const spec = specs.find(s => s.key === k);
    if (!spec) throw new Error(`Unknown parameter: ${k}`);
    return spec;
  };
  const values: Record<string, number> = { blade, angle, windSpeed, generator, tower };
  const setters: Record<string, (v: number) => void> = {
    blade: setBlade,
    angle: setAngle,
    windSpeed: setWindSpeed,
    generator: setGenerator,
    tower: setTower,
  };

  const shapeCp = { flat: 0.22, curved: 0.42, twisted: 0.48 }[shape];
  // Pitch efficiency peaks around 30°
  const pitchFactor = (a: number) => Math.max(0.12, 1 - Math.pow((a - 30) / 30, 2));
  const power = (b: number, a: number, w: number, t: number, gen: number) => {
    const hub = w * Math.pow(t / 10, 0.14);
    const cp = shapeCp * pitchFactor(a);
    const area = Math.PI * b * b;
    const raw = (0.5 * 1.225 * area * Math.pow(hub, 3) * cp) / 1000;
    return { hub, cp, raw, kw: Math.min(gen, raw) };
  };

  const { hub: hubWind, cp, raw: rawKw, kw: powerKw } = power(blade, angle, windSpeed, tower, generator);
  const efficiency = Math.round(cp * 100 * (powerKw / Math.max(1, rawKw)));
  const cost = Math.round((blade * 26 + tower * 9 + generator * 0.7) / 10) / 100;
  const homes = Math.round((powerKw * 8760 * 0.35) / 3500);
  const spin = Math.max(0.35, 6 - hubWind / 4) * (0.6 + angle / 60);
  const capped = rawKw > generator;

  const objectiveScore = Math.round(
    goal === "maxpower"
      ? Math.min(100, powerKw / 70)
      : goal === "efficiency"
        ? Math.min(100, efficiency * 2)
        : Math.min(100, 100 - Math.abs(500 - powerKw) / 12 - cost * 2),
  );
  const stars = Math.max(1, Math.min(5, Math.round(Math.max(objectiveScore, 1) / 20)));

  const angleCurve = useMemo(
    () =>
      Array.from({ length: 17 }, (_, i) => {
        const a = i * 5;
        return { x: a, y: Math.round(power(blade, a, windSpeed, tower, generator).kw) };
      }),
    [blade, windSpeed, tower, generator, shapeCp],
  );
  const windCurve = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => {
        const w = i + 1;
        return { x: w, y: Math.round(power(blade, angle, w, tower, generator).kw) };
      }),
    [blade, angle, tower, generator, shapeCp],
  );
  const bladeCurve = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        const b = 5 + i * 5;
        return { x: b, y: Math.round(power(b, angle, windSpeed, tower, generator).kw) };
      }),
    [angle, windSpeed, tower, generator, shapeCp],
  );

  const shown = lab.selected ?? lab.last;
  const lastSpec = specs.find(s => s.key === shown?.key);

  const coach =
    angle > 40 || angle < 18
      ? {
          observation:
            "Interesting! Your turbine is spinning, but it is not producing as much electricity as it could.",
          why: "Your blades are moving, but their angle is not capturing the wind efficiently — most of the air slips past.",
          suggestion: "Try changing the blade angle to around 25°–35° and compare the power output.",
          question: "Why do you think changing the blade angle affects the amount of energy produced?",
        }
      : capped
        ? {
            observation: "Your blades are catching more energy than your generator can handle.",
            why: "The generator has a rated limit, so everything above it is simply thrown away.",
            suggestion: `Fit a bigger generator (try ${specOf("generator").suggested} kW) or shorten the blades.`,
            question: "Is a bigger generator always the better choice? What does it cost you?",
          }
        : {
            observation: `Good engineering — ${Math.round(powerKw)} kW at ${efficiency}% efficiency.`,
            why: "Your blade size, angle and tower height are working together with the wind at this site.",
            suggestion: "Save this run, then raise the tower by 20 m and see how much free power you gain.",
            question: "Why does wind blow faster higher above the ground?",
          };

  const snapshot = () => ({
    params: [
      { label: "Blade length", value: `${blade} m` },
      { label: "Blade angle", value: `${angle}°` },
      { label: "Wind speed", value: `${windSpeed} m/s` },
      { label: "Generator", value: `${generator} kW` },
      { label: "Tower", value: `${tower} m` },
    ],
    metrics: [
      { label: "Power output", value: `${powerKw.toFixed(0)} kW`, numeric: Math.round(powerKw) },
      { label: "Efficiency", value: `${efficiency}%`, numeric: efficiency },
      { label: "Homes powered", value: `${homes}`, numeric: homes },
      { label: "Cost", value: `$${cost}M`, numeric: cost, better: "down" as const },
    ],
  });

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <p className="font-display text-xs tracking-[0.4em] text-bio uppercase">Energy Lab</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Wind Turbine Builder</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Wind power grows with the cube of wind speed and the square of blade length. Change one
          thing and the whole machine responds instantly.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-4">
            <Panel eyebrow="Energy objective" title={GOALS[goal].label}>
              <Choice
                label="Choose your goal — it changes the best ranges"
                value={goal}
                onChange={(v) => setGoal(v)}
                options={(Object.keys(GOALS) as Goal[]).map((k) => ({
                  value: k,
                  label: GOALS[k].label,
                }))}
              />
              <p className="mt-3 text-sm text-muted-foreground">{GOALS[goal].goal}</p>
            </Panel>

            <Panel eyebrow="Design console" title="Turbine spec">
              <div className="space-y-5">
                {specs.map((s) => (
                  <ZoneSlider
                    key={s.key}
                    spec={s}
                    value={values[s.key] ?? s.suggested}
                    onChange={v => setters[s.key]?.(v)}
                    onCommit={(from, to) => lab.record(s, from, to)}
                  />
                ))}
                <Choice
                  label="Blade shape"
                  value={shape}
                  onChange={(v) => {
                    lab.recordChoice({
                      key: "shape",
                      label: "Blade shape",
                      icon: "🛩",
                      from: shape,
                      to: v,
                      effect:
                        v === "flat"
                          ? "The blades push instead of lifting, so efficiency drops sharply."
                          : "The blades now use lift, like an aeroplane wing, and capture much more energy.",
                      reason:
                        "Curved and twisted blades create lift from moving air, which turns the rotor far more efficiently than a flat paddle.",
                      chain: ["Blade shape changed", "Lift changes", "Energy captured changes", "Power changes"],
                    });
                    setShape(v);
                  }}
                  options={[
                    { value: "flat", label: "Flat" },
                    { value: "curved", label: "Curved airfoil" },
                    { value: "twisted", label: "Twisted airfoil" },
                  ]}
                />
              </div>
            </Panel>

            <ModeSwitch
              mode={mode}
              onChange={setMode}
              challenge="Mission: power at least 400 homes while keeping the build cost under $2M."
            />
          </div>

          <div className="space-y-4">
            <Panel
              eyebrow="Live simulation"
              title={capped ? "⚠️ Generator at rated limit" : "Turbine running"}
            >
              <div className="relative h-[380px] overflow-hidden rounded-xl bg-gradient-to-b from-[oklch(0.2_0.06_250)] to-[oklch(0.3_0.07_200)] hud-grid">
                {/* Wind flow lines — speed and density follow the wind slider */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className="absolute h-px bg-primary/40"
                    style={{
                      top: `${10 + i * 12}%`,
                      left: 0,
                      width: `${20 + windSpeed * 3}%`,
                      animation: `slide-in-right ${Math.max(0.6, 6 - windSpeed / 4)}s linear infinite`,
                    }}
                  />
                ))}
                <svg
                  viewBox="0 0 300 300"
                  className="h-full w-full"
                  role="img"
                  aria-label={`Wind turbine with ${blade} metre blades at ${angle} degrees spinning in ${windSpeed} metres per second wind`}
                >
                  <rect
                    x="146"
                    y={300 - tower * 1.3}
                    width="8"
                    height={tower * 1.3}
                    fill="oklch(0.8 0.02 240)"
                    opacity="0.85"
                  />
                  <g
                    style={{
                      transformOrigin: `150px ${300 - tower * 1.3}px`,
                      animation: `orbit-spin ${spin}s linear infinite`,
                    }}
                  >
                    {[0, 120, 240].map((a) => (
                      <rect
                        key={a}
                        x="147"
                        y={300 - tower * 1.3 - blade * 0.9}
                        width={Math.max(2, 6 * Math.cos((angle * Math.PI) / 180) + 2)}
                        height={blade * 0.9}
                        rx="3"
                        fill="oklch(0.9 0.05 200)"
                        transform={`rotate(${a} 150 ${300 - tower * 1.3})`}
                      />
                    ))}
                  </g>
                  <circle cx="150" cy={300 - tower * 1.3} r="7" fill="oklch(0.78 0.16 205)" />
                  <rect x="0" y="288" width="300" height="12" fill="oklch(0.35 0.09 150)" />
                </svg>
                {/* Electricity meter */}
                <div className="absolute top-3 right-3 w-36 rounded-lg border border-border bg-background/60 p-2 text-[0.65rem]">
                  <p className="text-muted-foreground">Electricity meter</p>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-bio transition-[width] duration-300"
                      style={{ width: `${Math.min(100, (powerKw / 8000) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 font-display text-bio">{powerKw.toFixed(0)} kW</p>
                </div>
              </div>
            </Panel>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Readout label="Power output" value={`${powerKw.toFixed(0)} kW`} tone="bio" />
              <Readout label="Efficiency" value={`${efficiency}%`} />
              <Readout label="Homes powered" value={`${homes}`} tone="accent" />
              <Readout label="Est. cost" value={`$${cost}M`} tone="magma" />
            </div>

            <Panel eyebrow="Live scientific graphs" title="Watch the relationship">
              <div className="grid gap-3 md:grid-cols-3">
                <LiveGraph
                  title="Blade angle → power"
                  xLabel="blade angle (°)"
                  yLabel="power (kW)"
                  points={angleCurve}
                  marker={{ x: angle, y: Math.round(powerKw) }}
                />
                <LiveGraph
                  title="Wind speed → power"
                  xLabel="wind speed (m/s)"
                  yLabel="power (kW)"
                  points={windCurve}
                  marker={{ x: windSpeed, y: Math.round(powerKw) }}
                  color="var(--bio)"
                />
                <LiveGraph
                  title="Blade length → power"
                  xLabel="blade length (m)"
                  yLabel="power (kW)"
                  points={bladeCurve}
                  marker={{ x: blade, y: Math.round(powerKw) }}
                  color="var(--accent)"
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
                title="🌬 Why did the power change?"
                body={shown.reason}
                tryThis={`Set ${shown.label} back to ${shown.from}${shown.unit ? ` ${shown.unit}` : ""} and watch the glowing point slide along the graph.`}
              />
            )}

            <PredictionCard
              question="Your blades are at 45°. You change them to 30°. What do you think will happen to the electricity produced?"
              options={[
                "It will increase — the blades capture the wind better",
                "It will drop to zero",
                "Nothing will change",
                "The tower will get taller",
              ]}
              correct={0}
              explanation="Around 30° the blades work like aeroplane wings and transfer the most energy from the moving air, so output rises."
            />

            {mode !== "explore" && <ScienceCoach {...coach} muted={mode === "challenge"} />}

            <ResultScorecard
              stars={stars}
              rows={[
                { label: "Objective completion", value: `${Math.max(0, objectiveScore)}%` },
                { label: "Efficiency", value: `${efficiency}%` },
                { label: "Stability", value: capped ? "Capped output" : windSpeed > 22 ? "Storm risk" : "Excellent" },
                { label: "Resource usage", value: cost > 3 ? "Expensive" : "Good" },
              ]}
              overall={objectiveScore > 75 ? "Great experiment!" : "Good attempt — keep tuning."}
              didWell={`You chose a strong combination of ${windSpeed} m/s wind and ${blade} m ${shape} blades.`}
              improve={
                angle > 40 || angle < 18
                  ? "Your blade angle was inefficient for the current wind conditions."
                  : capped
                    ? "Your generator is capping the energy your blades collect."
                    : "Your tower could be taller to reach faster, smoother wind."
              }
              tryNext="Run the experiment again with a 30° blade angle and compare the power output."
            />

            <BestSettings
              hasAttempt={runs.runs.length > 0}
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
              expectedImprovement="Approximately 12% better efficiency in this simulation model."
              why={`The suggested blade angle captures the available wind more effectively, and the rest of the setup matches "${GOALS[goal].label}".`}
            />

            <CompareRuns
              current={snapshot()}
              runs={runs.runs}
              onSave={() => runs.save(snapshot())}
              onClear={runs.clear}
            />

            <ParameterTimeline
              history={lab.history}
              onReplay={id => {
                const event = lab.history.find(e => e.id === id);
                if (!event) return;
                if (typeof event.to === "number") setters[event.key]?.(event.to);
                if (event.key === "shape" && (event.to === "flat" || event.to === "curved" || event.to === "twisted")) setShape(event.to);
                lab.replay(id);
              }}
              activeId={lab.selected?.id ?? null}
            />

            <Panel eyebrow="Environment" title="Impact notes">
              <p className="text-sm text-muted-foreground">
                Wind power produces no fuel emissions while running, but turbines need land or
                seabed, and engineers plan sites carefully to protect birds and bats. No turbine can
                capture more than 59.3% of the wind's energy — that limit is called Betz's law.
              </p>
            </Panel>
          </div>
        </div>
      </main>
    </div>
  );
}
