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

export const Route = createFileRoute("/experiments/volcano")({
  head: () => ({
    meta: [
      { title: "Volcano Eruption Simulator — Future Science Lab" },
      {
        name: "description",
        content:
          "Change magma temperature, viscosity, gas pressure and crater width, see the cause-and-effect chain, and find the best range for your eruption mission.",
      },
      { property: "og:title", content: "Volcano Eruption Simulator" },
      {
        property: "og:description",
        content: "Interactive eruption physics with live parameter-impact coaching.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VolcanoPage,
});

type Rock = "basalt" | "andesite" | "rhyolite";
type Objective = "controlled" | "plinian" | "lavaflow";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  kind: "lava" | "ash" | "smoke";
  size: number;
};

const OBJECTIVES: Record<Objective, { label: string; goal: string }> = {
  controlled: {
    label: "Safe study eruption",
    goal: "Produce a steady, controlled eruption scientists could observe safely.",
  },
  plinian: {
    label: "Explosive ash column",
    goal: "Build the tall, violent ash column of a Plinian eruption.",
  },
  lavaflow: {
    label: "Longest lava river",
    goal: "Make runny lava travel as far as possible without exploding.",
  },
};

function z(from: number, to: number, tone: Zone["tone"]): Zone {
  return { from, to, tone };
}

function buildSpecs(objective: Objective): ParamSpec[] {
  const pressureZones: Record<Objective, Zone[]> = {
    controlled: [z(0, 20, "low"), z(20, 45, "learn"), z(45, 65, "optimal"), z(65, 80, "good"), z(80, 100, "high")],
    plinian: [z(0, 40, "low"), z(40, 60, "learn"), z(60, 75, "good"), z(75, 92, "optimal"), z(92, 100, "high")],
    lavaflow: [z(0, 10, "low"), z(10, 25, "optimal"), z(25, 45, "good"), z(45, 70, "learn"), z(70, 100, "high")],
  };
  const viscosityZones: Record<Objective, Zone[]> = {
    controlled: [z(0, 15, "learn"), z(15, 35, "optimal"), z(35, 60, "good"), z(60, 80, "learn"), z(80, 100, "high")],
    plinian: [z(0, 30, "low"), z(30, 55, "learn"), z(55, 70, "good"), z(70, 88, "optimal"), z(88, 100, "high")],
    lavaflow: [z(0, 12, "optimal"), z(12, 30, "good"), z(30, 55, "learn"), z(55, 80, "high"), z(80, 100, "high")],
  };
  const tempZones: Record<Objective, Zone[]> = {
    controlled: [z(700, 850, "low"), z(850, 1000, "learn"), z(1000, 1150, "optimal"), z(1150, 1250, "good"), z(1250, 1300, "high")],
    plinian: [z(700, 800, "low"), z(800, 900, "optimal"), z(900, 1050, "good"), z(1050, 1200, "learn"), z(1200, 1300, "high")],
    lavaflow: [z(700, 950, "low"), z(950, 1100, "learn"), z(1100, 1200, "good"), z(1200, 1280, "optimal"), z(1280, 1300, "high")],
  };
  const suggested: Record<Objective, { temp: number; visc: number; press: number; crater: number }> =
    {
      controlled: { temp: 1100, visc: 30, press: 55, crater: 200 },
      plinian: { temp: 870, visc: 80, press: 85, crater: 320 },
      lavaflow: { temp: 1250, visc: 8, press: 18, crater: 140 },
    };
  const s = suggested[objective];

  return [
    {
      key: "temp",
      label: "Magma temperature",
      icon: "🌡",
      unit: "°C",
      min: 700,
      max: 1300,
      step: 10,
      zones: tempZones[objective],
      suggested: s.temp,
      effect: {
        up: "The magma glows brighter, thins out and flows more easily — the eruption becomes calmer and runnier.",
        down: "The magma stiffens, traps more gas bubbles and the eruption becomes more violent.",
      },
      reason:
        "Heat makes magma runnier, so gas bubbles escape gently instead of building up until they burst.",
      pros: ["Runnier lava travels further", "Fewer trapped gas bubbles means a calmer eruption"],
      cons: ["Very hot magma rarely makes a tall ash column", "Extreme heat is unrealistic for most volcanoes"],
      chain: {
        up: ["Temperature ↑", "Magma thins", "Gas escapes easily", "Gentler eruption"],
        down: ["Temperature ↓", "Magma thickens", "Gas gets trapped", "Bigger blast"],
      },
    },
    {
      key: "viscosity",
      label: "Lava viscosity",
      icon: "🍯",
      unit: "idx",
      min: 0,
      max: 100,
      zones: viscosityZones[objective],
      suggested: s.visc,
      effect: {
        up: "Lava gets sticky like honey, creeps slowly and plugs the vent so pressure builds.",
        down: "Lava becomes watery, races down the slope and flows much further.",
      },
      reason:
        "Viscosity is how thick a liquid is. Thick magma holds gas bubbles in; thin magma lets them pop out quietly.",
      pros: ["Thick lava builds explosive pressure", "Thin lava produces long, fast flows"],
      cons: ["Very thick lava can block the vent completely", "Very thin lava never makes ash"],
      chain: {
        up: ["Viscosity ↑", "Gas trapped in magma", "Pressure builds", "Explosion strength ↑"],
        down: ["Viscosity ↓", "Lava flows faster", "Flow distance ↑"],
      },
    },
    {
      key: "pressure",
      label: "Gas pressure",
      icon: "💨",
      unit: "MPa",
      min: 0,
      max: 100,
      zones: pressureZones[objective],
      suggested: s.press,
      effect: {
        up: "The gauge climbs, the ground shakes, magma bubbles multiply and the eruption throws material much higher.",
        down: "The shaking calms, fewer bubbles form and the volcano settles into a quiet ooze.",
      },
      reason:
        "Dissolved gas expands as magma rises. More trapped gas pushes the magma upward with greater force until it bursts out.",
      pros: ["Taller ash column", "More dramatic, easier-to-measure eruption"],
      cons: ["Very high pressure is dangerous and hard to predict", "Explosive eruptions destroy the lava flow"],
      chain: {
        up: ["Gas pressure ↑", "Magma pressure ↑", "Volcano shakes", "Explosion strength ↑"],
        down: ["Gas pressure ↓", "Magma rises slowly", "Quiet lava flow"],
      },
    },
    {
      key: "crater",
      label: "Crater width",
      icon: "🕳",
      unit: "m",
      min: 50,
      max: 400,
      step: 10,
      zones:
        objective === "plinian"
          ? [z(50, 150, "low"), z(150, 240, "learn"), z(240, 300, "good"), z(300, 380, "optimal"), z(380, 400, "high")]
          : [z(50, 90, "low"), z(90, 150, "good"), z(150, 240, "optimal"), z(240, 330, "learn"), z(330, 400, "high")],
      suggested: s.crater,
      effect: {
        up: "The vent widens, material spreads out and the jet becomes broader but less focused.",
        down: "The vent narrows and squeezes the escaping magma into a faster, more focused jet.",
      },
      reason:
        "A narrow opening squeezes escaping gas and magma, speeding it up — like putting your thumb over a hose.",
      pros: ["Wide craters release huge volumes", "Narrow craters produce faster jets"],
      cons: ["Very wide craters lower the eruption's reach", "Very narrow vents clog easily"],
      chain: {
        up: ["Crater width ↑", "Gas spreads out", "Jet speed ↓", "Broader eruption"],
        down: ["Crater width ↓", "Escape route narrows", "Jet speed ↑"],
      },
    },
  ];
}

function VolcanoPage() {
  const [objective, setObjective] = useState<Objective>("controlled");
  const [mode, setMode] = useState<LabMode>("explore");
  const [temp, setTemp] = useState(1100);
  const [viscosity, setViscosity] = useState(35);
  const [pressure, setPressure] = useState(50);
  const [crater, setCrater] = useState(220);
  const [rock, setRock] = useState<Rock>("basalt");
  const [erupting, setErupting] = useState(false);

  const lab = useParamLab();
  const runs = useRuns();
  const specs = useMemo(() => buildSpecs(objective), [objective]);
  const specOf = (k: string) => specs.find((s) => s.key === k)!;
  const values: Record<string, number> = { temp, viscosity, pressure, crater };
  const setters: Record<string, (v: number) => void> = {
    temp: setTemp,
    viscosity: setViscosity,
    pressure: setPressure,
    crater: setCrater,
  };

  const silica = { basalt: 50, andesite: 60, rhyolite: 72 }[rock];
  const calc = (t: number, v: number, p: number) => {
    const ev = Math.min(100, v + (silica - 50) * 1.1 - (t - 1100) / 20);
    const ex = Math.max(0, Math.min(100, Math.round(p * 0.6 + ev * 0.5 - (t - 900) / 25)));
    return { ev, ex };
  };
  const { ev: effectiveViscosity, ex: explosivity } = calc(temp, viscosity, pressure);
  const style =
    explosivity > 68 ? "Plinian (explosive)" : explosivity > 38 ? "Strombolian" : "Effusive";
  const lavaSpeed = Math.max(0.2, (12 - effectiveViscosity / 10) * (temp / 1100));
  const flowDistance = Math.round(lavaSpeed * 1.6 * (1 - explosivity / 200) * 10) / 10;
  const ashHeight = Math.round((explosivity / 100) * 22 + 1);

  // Objective-aware success score
  const objectiveScore = Math.round(
    objective === "plinian"
      ? Math.min(100, explosivity * 1.1 + ashHeight)
      : objective === "lavaflow"
        ? Math.min(100, flowDistance * 4 + (60 - explosivity) / 2)
        : Math.min(100, 100 - Math.abs(52 - explosivity) * 1.6),
  );
  const stars = Math.max(1, Math.min(5, Math.round(objectiveScore / 20)));

  const pressureCurve = useMemo(
    () =>
      Array.from({ length: 21 }, (_, i) => {
        const p = i * 5;
        return { x: p, y: calc(temp, viscosity, p).ex };
      }),
    [temp, viscosity, silica],
  );
  const viscosityCurve = useMemo(
    () =>
      Array.from({ length: 21 }, (_, i) => {
        const v = i * 5;
        const ev = Math.min(100, v + (silica - 50) * 1.1 - (temp - 1100) / 20);
        return { x: v, y: Math.round(Math.max(0.2, (12 - ev / 10) * (temp / 1100)) * 1.6 * 10) / 10 };
      }),
    [temp, silica],
  );
  const tempCurve = useMemo(
    () =>
      Array.from({ length: 13 }, (_, i) => {
        const t = 700 + i * 50;
        return { x: t, y: Math.round(Math.max(0.2, (12 - calc(t, viscosity, pressure).ev / 10) * (t / 1100)) * 10) / 10 };
      }),
    [viscosity, pressure, silica],
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ explosivity, effectiveViscosity, crater, erupting, temp });
  stateRef.current = { explosivity, effectiveViscosity, crater, erupting, temp };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let parts: Particle[] = [];
    let raf = 0;
    let tick = 0;

    const draw = () => {
      const s = stateRef.current;
      tick += 1;
      ctx.clearRect(0, 0, w, h);

      // Ground shake grows with pressure/explosivity
      const shake = s.erupting ? (s.explosivity / 100) * 4 : 0;
      const sx = Math.sin(tick * 0.6) * shake;
      const sy = Math.cos(tick * 0.9) * shake * 0.5;
      ctx.save();
      ctx.translate(sx, sy);

      const baseY = h - 10;
      const peakY = h * 0.42;
      const craterHalf = (s.crater / 400) * (w * 0.12) + 12;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, baseY);
      ctx.lineTo(w / 2 - craterHalf, peakY);
      ctx.lineTo(w / 2 + craterHalf, peakY);
      ctx.lineTo(w * 0.9, baseY);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, peakY, 0, baseY);
      grad.addColorStop(0, "rgba(90,105,140,0.95)");
      grad.addColorStop(1, "rgba(35,45,70,0.95)");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "rgba(120,220,255,0.35)";
      ctx.stroke();

      // Magma chamber glow scales with temperature and pressure
      ctx.beginPath();
      ctx.ellipse(w / 2, baseY - 4, craterHalf * (1.6 + s.explosivity / 90), 16, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,${120 + (s.temp - 900) / 6},40,${0.12 + s.explosivity / 500})`;
      ctx.fill();

      // Rising bubbles inside the cone show gas pressure
      const bubbles = Math.round(s.explosivity / 12);
      for (let i = 0; i < bubbles; i++) {
        const by = baseY - ((tick * 1.4 + i * 37) % (baseY - peakY));
        ctx.beginPath();
        ctx.arc(w / 2 + Math.sin(i + tick / 30) * craterHalf * 0.5, by, 2 + (i % 3), 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,170,60,0.55)";
        ctx.fill();
      }

      if (s.erupting) {
        const rate = 2 + Math.round(s.explosivity / 12);
        for (let i = 0; i < rate; i++) {
          const power = 1 + s.explosivity / 22;
          const kind: Particle["kind"] =
            Math.random() < 0.45 ? "lava" : Math.random() < 0.6 ? "ash" : "smoke";
          parts.push({
            x: w / 2 + (Math.random() - 0.5) * craterHalf * 1.6,
            y: peakY,
            vx: (Math.random() - 0.5) * power * (kind === "lava" ? 1.6 : 2.4),
            vy: -Math.random() * power * (kind === "lava" ? 2.4 : 3.2) - 1,
            life: 1,
            kind,
            size: kind === "lava" ? 2 + Math.random() * 3 : 6 + Math.random() * 14,
          });
        }
      }

      parts = parts.filter((p) => p.life > 0.02 && p.y < h + 40);
      if (parts.length > 900) parts.splice(0, parts.length - 900);

      for (const p of parts) {
        if (p.kind === "lava") {
          p.vy += 0.14;
          p.x += p.vx * (1 + (30 - Math.min(30, s.effectiveViscosity)) / 30);
          p.y += p.vy;
          p.life -= 0.006 + s.effectiveViscosity / 20000;
          const heat = Math.max(0, Math.min(1, p.life));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,${Math.round(90 + heat * 150)},${Math.round(30 * heat)},${0.35 + heat * 0.6})`;
          ctx.fill();
        } else {
          p.vy -= 0.02;
          p.vx += (Math.random() - 0.5) * 0.06;
          p.x += p.vx;
          p.y += p.vy;
          p.size += 0.35;
          p.life -= 0.008;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle =
            p.kind === "ash"
              ? `rgba(90,90,105,${p.life * 0.35})`
              : `rgba(190,200,215,${p.life * 0.22})`;
          ctx.fill();
        }
      }
      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const lastSpec = lab.last ? specs.find((s) => s.key === lab.last!.key) : undefined;
  const shown = lab.selected ?? lab.last;

  const coach =
    explosivity > 75 && objective !== "plinian"
      ? {
          observation:
            "Your volcano is erupting very violently — much stronger than this mission needs.",
          why: "Thick magma plus high gas pressure traps bubbles until they burst all at once.",
          suggestion: `Try lowering gas pressure towards ${specOf("pressure").suggested} MPa, or heating the magma to thin it out.`,
          question: "Why do you think hotter magma usually erupts more gently?",
        }
      : explosivity < 20 && objective === "plinian"
        ? {
            observation: "Your magma is oozing out quietly instead of exploding.",
            why: "Runny, hot magma lets gas escape gently, so pressure never builds to a blast.",
            suggestion: "Cool the magma below 900 °C, pick rhyolite, and raise gas pressure above 75 MPa.",
            question: "What is it about sticky magma that makes gas so dangerous?",
          }
        : {
            observation: `Good balance — you are getting a ${style.toLowerCase()} eruption with a ${ashHeight} km ash column.`,
            why: "Your combination of heat, thickness and gas pressure sits close to the range this mission needs.",
            suggestion: "Change one value at a time and watch the graphs so you can see exactly which one matters most.",
            question: "Which parameter do you think changes the eruption the most — and how could you prove it?",
          };

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <p className="font-display text-xs tracking-[0.4em] text-magma uppercase">
          Earth Science Lab
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Volcano Eruption Simulator</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Magma is molten rock full of dissolved gas. Change one thing and watch the whole chain of
          cause and effect light up.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-4">
            <Panel eyebrow="Mission objective" title={OBJECTIVES[objective].label}>
              <Choice
                label="Choose your goal — the best range depends on it"
                value={objective}
                onChange={(v) => setObjective(v)}
                options={(Object.keys(OBJECTIVES) as Objective[]).map((k) => ({
                  value: k,
                  label: OBJECTIVES[k].label,
                }))}
              />
              <p className="mt-3 text-sm text-muted-foreground">{OBJECTIVES[objective].goal}</p>
            </Panel>

            <Panel eyebrow="Control console" title="Parameters">
              <div className="space-y-5">
                {specs.map((s) => (
                  <ZoneSlider
                    key={s.key}
                    spec={s}
                    value={values[s.key]}
                    onChange={setters[s.key]}
                    onCommit={(from, to) => lab.record(s, from, to)}
                  />
                ))}
                <Choice
                  label="Rock composition"
                  value={rock}
                  onChange={(v) => {
                    lab.recordChoice({
                      key: "rock",
                      label: "Rock composition",
                      icon: "🪨",
                      from: rock,
                      to: v,
                      effect:
                        v === "rhyolite"
                          ? "The magma becomes far stickier, so the eruption turns explosive."
                          : v === "basalt"
                            ? "The magma becomes runny, so lava flows instead of exploding."
                            : "The magma sits between runny and sticky, giving mixed behaviour.",
                      reason:
                        "More silica in the rock makes magma thicker, and thick magma traps gas bubbles.",
                      chain: ["Silica ↑", "Magma thicker", "Gas trapped", "Explosivity ↑"],
                    });
                    setRock(v);
                  }}
                  options={[
                    { value: "basalt", label: "Basalt (50% silica)" },
                    { value: "andesite", label: "Andesite (60%)" },
                    { value: "rhyolite", label: "Rhyolite (72%)" },
                  ]}
                />
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setErupting((e) => !e)}
                    className="flex-1 rounded-full bg-primary px-4 py-2 font-display text-xs tracking-widest text-primary-foreground uppercase neon-ring"
                  >
                    {erupting ? "Stop" : "Erupt"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setErupting(false);
                      setTemp(1100);
                      setViscosity(35);
                      setPressure(50);
                      setCrater(220);
                      setRock("basalt");
                      lab.clear();
                    }}
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
              challenge="Mission: create an ash column of at least 15 km while keeping gas pressure below 80 MPa."
            />
          </div>

          <div className="space-y-4">
            <Panel eyebrow="Live simulation" title={`Eruption style: ${style}`} className="p-3">
              <canvas
                ref={canvasRef}
                aria-label={`Animated volcano eruption, explosivity ${explosivity} out of 100`}
                role="img"
                className="h-[380px] w-full rounded-xl bg-gradient-to-b from-[oklch(0.18_0.06_275)] to-[oklch(0.12_0.04_265)] hud-grid"
              />
            </Panel>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Readout label="Explosivity" value={`${explosivity}/100`} tone="magma" />
              <Readout label="Lava flow speed" value={`${lavaSpeed.toFixed(1)} m/s`} />
              <Readout label="Ash column" value={`${ashHeight} km`} tone="accent" />
              <Readout label="Flow distance" value={`${flowDistance} km`} tone="bio" />
            </div>

            <Panel eyebrow="Live scientific graphs" title="Watch the relationship">
              <div className="grid gap-3 md:grid-cols-3">
                <LiveGraph
                  title="Pressure → eruption"
                  xLabel="gas pressure (MPa)"
                  yLabel="explosivity"
                  points={pressureCurve}
                  marker={{ x: pressure, y: explosivity }}
                  color="var(--magma)"
                />
                <LiveGraph
                  title="Viscosity → flow"
                  xLabel="viscosity (idx)"
                  yLabel="flow distance (km)"
                  points={viscosityCurve}
                  marker={{ x: viscosity, y: flowDistance }}
                />
                <LiveGraph
                  title="Temperature → lava speed"
                  xLabel="temperature (°C)"
                  yLabel="lava speed (m/s)"
                  points={tempCurve}
                  marker={{ x: temp, y: Math.round(lavaSpeed * 10) / 10 }}
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
                title={`🌋 Why did the eruption change?`}
                body={shown.reason}
                tryThis={`Move ${shown.label} back the other way and watch the explosivity graph glow at a different point.`}
              />
            )}

            <PredictionCard
              question="You raise the gas pressure to 90 MPa on sticky rhyolite magma. What do you think will happen?"
              options={[
                "The eruption will become stronger",
                "The eruption will stop",
                "Nothing will change",
                "The lava will freeze",
              ]}
              correct={0}
              explanation="Higher trapped gas pressure pushes magma up harder, and sticky magma will not let the bubbles escape quietly — so the eruption becomes more explosive in this model."
            />

            {mode !== "explore" && (
              <ScienceCoach {...coach} muted={mode === "challenge"} />
            )}

            <ResultScorecard
              stars={stars}
              rows={[
                { label: "Objective completion", value: `${objectiveScore}%` },
                { label: "Explosivity", value: `${explosivity}/100` },
                { label: "Stability", value: explosivity > 85 ? "Risky" : explosivity < 15 ? "Very calm" : "Good" },
                { label: "Ash column", value: `${ashHeight} km` },
              ]}
              overall={
                objectiveScore > 80
                  ? "Great experiment!"
                  : objectiveScore > 55
                    ? "Solid work — you are close."
                    : "Keep experimenting — you are learning fast."
              }
              didWell={`You combined ${rock} magma at ${temp} °C with ${pressure} MPa of gas pressure to produce a ${style.toLowerCase()} eruption.`}
              improve={
                objective === "plinian" && explosivity < 70
                  ? "Your magma is still too runny for a tall ash column."
                  : objective === "lavaflow" && explosivity > 35
                    ? "Too much gas pressure is blowing your lava apart instead of letting it flow."
                    : "Your settings sit slightly outside the recommended range for this objective."
              }
              tryNext={`Run it again with gas pressure near ${specOf("pressure").suggested} MPa and compare the two results.`}
            />

            <BestSettings
              specs={specs}
              values={values}
              onApplyAll={() =>
                specs.forEach((s) => {
                  lab.record(s, values[s.key], s.suggested);
                  setters[s.key](s.suggested);
                })
              }
              onApplyOne={(key) => {
                const s = specOf(key);
                lab.record(s, values[key], s.suggested);
                setters[key](s.suggested);
              }}
              expectedImprovement="Roughly 15–25% closer to your objective in this simulation model."
              why={`For "${OBJECTIVES[objective].label}", these values balance heat, thickness and gas so the eruption behaves the way the mission needs.`}
            />

            <CompareRuns
              current={{
                params: [
                  { label: "Temperature", value: `${temp} °C` },
                  { label: "Viscosity", value: `${viscosity}` },
                  { label: "Gas pressure", value: `${pressure} MPa` },
                  { label: "Crater width", value: `${crater} m` },
                  { label: "Rock", value: rock },
                ],
                metrics: [
                  { label: "Explosivity", value: `${explosivity}/100`, numeric: explosivity },
                  { label: "Ash column", value: `${ashHeight} km`, numeric: ashHeight },
                  { label: "Flow distance", value: `${flowDistance} km`, numeric: flowDistance },
                  { label: "Objective score", value: `${objectiveScore}%`, numeric: objectiveScore },
                ],
              }}
              runs={runs.runs}
              onSave={() =>
                runs.save({
                  params: [
                    { label: "Temperature", value: `${temp} °C` },
                    { label: "Viscosity", value: `${viscosity}` },
                    { label: "Gas pressure", value: `${pressure} MPa` },
                    { label: "Crater width", value: `${crater} m` },
                    { label: "Rock", value: rock },
                  ],
                  metrics: [
                    { label: "Explosivity", value: `${explosivity}/100`, numeric: explosivity },
                    { label: "Ash column", value: `${ashHeight} km`, numeric: ashHeight },
                    { label: "Flow distance", value: `${flowDistance} km`, numeric: flowDistance },
                    { label: "Objective score", value: `${objectiveScore}%`, numeric: objectiveScore },
                  ],
                })
              }
              onClear={runs.clear}
            />

            <ParameterTimeline
              history={lab.history}
              onReplay={lab.replay}
              activeId={lab.selected?.id ?? null}
            />

            <Panel eyebrow="Safety" title="Field rules">
              <p className="text-sm text-muted-foreground">
                Real volcanoes are dangerous. Scientists watch them from a safe distance using
                drones, satellites and seismometers, and always follow official exclusion zones.
                This is a simplified educational model, not a prediction tool.
              </p>
            </Panel>
          </div>
        </div>
      </main>
    </div>
  );
}
