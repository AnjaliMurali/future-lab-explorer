import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { SiteHeader } from "@/components/lab/SiteHeader";
import { Panel, Choice, Readout } from "@/components/lab/Panel";
import { Button } from "@/components/ui/button";
import { ZoneSlider } from "@/components/lab/ZoneSlider";
import { BestSettings, CompareRuns, LiveGraph, ModeSwitch, ParameterTimeline, PredictionCard, ResultScorecard, ScienceCoach, ScienceNote, WhatChangedPanel } from "@/components/lab/ImpactPanels";
import { useParamLab, useRuns, type LabMode, type Run } from "@/lib/param-lab";
import { GRAVITY_GOALS, gravityMetrics, gravityScore, gravitySpecs, type GravityGoal } from "@/lib/gravity-model";

export const Route = createFileRoute("/experiments/gravity")({
  head: () => ({ meta: [
    { title: "Gravity Chamber — Future Science Lab" },
    { name: "description", content: "Compare gravity across worlds, predict jumps and falling motion, and improve your mission with live graphs and saved attempts." },
    { property: "og:title", content: "Gravity Chamber — Future Science Lab" },
    { property: "og:description", content: "Explore gravity with live cause-and-effect science experiments." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: GravityPage,
});

const PLANETS = {
  earth: { label: "Earth", g: 9.81 }, moon: { label: "Moon", g: 1.62 },
  mars: { label: "Mars", g: 3.72 }, jupiter: { label: "Jupiter", g: 24.79 },
  custom: { label: "Custom Planet", g: 6 },
} as const;
type PlanetKey = keyof typeof PLANETS;

function GravityPage() {
  const [planet, setPlanet] = useState<PlanetKey>("moon");
  const [customG, setCustomG] = useState(6);
  const [mass, setMass] = useState(40);
  const [impulse, setImpulse] = useState(200);
  const [goal, setGoal] = useState<GravityGoal>("float");
  const [mode, setMode] = useState<LabMode>("explore");
  const [attempted, setAttempted] = useState(false);
  const lab = useParamLab();
  const runs = useRuns();
  const specs = useMemo(() => gravitySpecs(goal), [goal]);
  const g = planet === "custom" ? customG : PLANETS[planet].g;
  const metrics = gravityMetrics(g, mass, impulse);
  const { speed, jumpHeight, hangTime, weight, period, fallTime, energy } = metrics;
  const values: Record<string, number> = { g, mass, impulse };
  const score = gravityScore(goal, g, mass, impulse);
  const shown = lab.selected ?? lab.last;
  const lastSpec = specs.find(s => s.key === shown?.key);
  const setValue = (key: string, value: number) => {
    if (key === "g") { setPlanet("custom"); setCustomG(value); }
    if (key === "mass") setMass(value);
    if (key === "impulse") setImpulse(value);
  };
  const apply = (key: string) => {
    const spec = specs.find(s => s.key === key);
    if (!spec) return;
    lab.record(spec, values[key], spec.suggested);
    setValue(key, spec.suggested);
  };
  const snapshot = (): Omit<Run, "name"> => ({
    params: [{ label: "Mission", value: goal }, ...specs.map(s => ({ label: s.label, value: String(values[s.key]) }))],
    metrics: [
      { label: "Jump height", value: `${jumpHeight.toFixed(2)} m`, numeric: jumpHeight },
      { label: "Hang time", value: `${hangTime.toFixed(2)} s`, numeric: hangTime },
      { label: "10 m fall time", value: `${fallTime.toFixed(2)} s`, numeric: fallTime },
      { label: "Weight", value: `${weight.toFixed(1)} N`, numeric: weight },
      { label: "Mission match", value: `${score}%`, numeric: score },
    ],
  });
  const saveAttempt = () => { runs.save(snapshot()); setAttempted(true); };
  const replayRun = (run: Run) => {
    const mission = run.params.find(p => p.label === "Mission")?.value;
    if (mission === "float" || mission === "earth" || mission === "strength") setGoal(mission);
    specs.forEach(s => {
      const value = Number(run.params.find(p => p.label === s.label)?.value);
      if (!Number.isFinite(value)) return;
      lab.record(s, values[s.key], value);
      setValue(s.key, value);
    });
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sim = useRef({ g, speed });
  sim.current = { g, speed };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const tokens = getComputedStyle(document.documentElement);
    const colors = Object.fromEntries(["border", "primary", "accent", "foreground", "bio"].map(key => [key, tokens.getPropertyValue(`--${key}`)]));
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

    let elapsed = 0;
    let previous = 0;
    let raf = 0;

    const draw = (timestamp = 0) => {
      const { g: gg, speed: jv } = sim.current;
      const dt = previous ? Math.min((timestamp - previous) / 1000, 0.05) : 0;
      previous = timestamp;
      elapsed += dt;
      const floor = h - 30;
      const px = (floor - 40) / 10;
      const dropDuration = Math.sqrt(20 / gg);
      const dropT = elapsed % (dropDuration + 0.5);
      const ballY = 40 + Math.min(10, 0.5 * gg * dropT ** 2) * px;
      const flightDuration = 2 * jv / gg;
      const jumpT = elapsed % (flightDuration + 0.5);
      const height = Math.max(0, jv * jumpT - 0.5 * gg * jumpT ** 2);
      // Adapt only the jumper's display scale so extreme settings remain visible.
      const jumperY = height * Math.min(px, (h - 90) / Math.max(1, jv ** 2 / (2 * gg)));
      const theta = 0.6 * Math.cos(Math.sqrt(gg / 1.2) * elapsed);

      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = colors.border;
      ctx.beginPath();
      ctx.moveTo(0, floor);
      ctx.lineTo(w, floor);
      ctx.stroke();

      // ball
      ctx.beginPath();
      ctx.arc(w * 0.2, ballY, 12, 0, Math.PI * 2);
      ctx.fillStyle = colors.primary;
      ctx.fill();

      // jumper
      ctx.beginPath();
      ctx.roundRect(w * 0.48 - 9, floor - 32 - jumperY, 18, 32, 6);
      ctx.fillStyle = colors.accent;
      ctx.fill();

      // pendulum
      const px0 = w * 0.78;
      const py0 = h * 0.22;
      const len = h * 0.4;
      const bx = px0 + Math.sin(theta) * len;
      const by = py0 + Math.cos(theta) * len;
      ctx.beginPath();
      ctx.moveTo(px0, py0);
      ctx.lineTo(bx, by);
      ctx.strokeStyle = colors.foreground;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(bx, by, 11, 0, Math.PI * 2);
      ctx.fillStyle = colors.bio;
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <p className="font-display text-xs text-accent uppercase">Physics Lab</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Gravity Chamber</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Your mass stays the same across worlds. Your weight, jumps and falling motion do not.</p>
        <div className="mt-8 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="min-w-0 space-y-4">
            <Panel eyebrow="Chamber console" title="Conditions">
              <div className="space-y-5">
                <Choice label="Mission" value={goal} onChange={setGoal} options={(Object.keys(GRAVITY_GOALS) as GravityGoal[]).map(k => ({ value: k, label: GRAVITY_GOALS[k].label }))} />
                <Choice label="World" value={planet} onChange={next => {
                  const nextG = next === "custom" ? customG : PLANETS[next].g;
                  const spec = specs.find(s => s.key === "g");
                  if (spec) lab.record(spec, g, nextG);
                  setPlanet(next);
                }} options={(Object.keys(PLANETS) as PlanetKey[]).map(k => ({ value: k, label: PLANETS[k].label }))} />
                {specs.map(spec => <ZoneSlider key={spec.key} spec={spec} value={values[spec.key]} onChange={v => setValue(spec.key, v)} onCommit={(from, to) => lab.record(spec, from, to)} />)}
              </div>
            </Panel>
            <ModeSwitch mode={mode} onChange={setMode} challenge="Match your mission's gravity with a 40 kg explorer and a 200 N·s push. Compare two attempts." />
            <PredictionCard question="Keep the same mass and push, then switch from Earth to the Moon. What happens?" options={["Higher jump and longer hang time", "Lower jump", "Mass becomes smaller", "Nothing changes"]} correct={0} explanation="The Moon's weaker gravity slows your upward motion less quickly. Mass stays the same; weight decreases." />
          </div>
          <div className="min-w-0 space-y-4">
            <Panel eyebrow="Live simulation" title={`${PLANETS[planet].label} · g = ${g.toFixed(2)} m/s²`}>
              <canvas ref={canvasRef} role="img" aria-label="Gravity chamber: ball dropped from 10 metres, jumping explorer and 1.2 metre pendulum" className="h-[380px] w-full rounded-xl bg-secondary/30 hud-grid" />
              <p className="mt-2 text-xs text-muted-foreground">10 m drop · Jumper (auto-scaled) · 1.2 m pendulum</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={saveAttempt}><Play />Run and save attempt</Button>
                <Button variant="outline" onClick={() => { setPlanet("moon"); setMass(40); setImpulse(200); }}><RotateCcw />Reset conditions</Button>
              </div>
            </Panel>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Readout label="Jump height" value={`${jumpHeight.toFixed(2)} m`} />
              <Readout label="Hang time" value={`${hangTime.toFixed(2)} s`} tone="accent" />
              <Readout label="Weight" value={`${weight.toFixed(1)} N`} tone="magma" />
              <Readout label="10 m fall time" value={`${fallTime.toFixed(2)} s`} />
              <Readout label="Pendulum period" value={`${period.toFixed(2)} s`} tone="bio" />
              <Readout label="Jump energy" value={`${energy.toFixed(0)} J`} tone="magma" />
            </div>
            <Panel eyebrow="Live scientific graphs" title="Watch the relationship">
              <div className="grid gap-3 md:grid-cols-3">
                <LiveGraph title="Gravity → jump height" xLabel="gravity (m/s²)" yLabel="height (m)" points={Array.from({ length: 60 }, (_, i) => ({ x: 0.5 + i * 0.5, y: gravityMetrics(0.5 + i * 0.5, mass, impulse).jumpHeight }))} marker={{ x: g, y: jumpHeight }} />
                <LiveGraph title="Mass → weight" xLabel="mass (kg)" yLabel="weight (N)" points={[{ x: 10, y: 10 * g }, { x: 120, y: 120 * g }]} marker={{ x: mass, y: weight }} color="var(--magma)" />
                <LiveGraph title="Impulse → jump height" xLabel="impulse (N·s)" yLabel="height (m)" points={Array.from({ length: 56 }, (_, i) => ({ x: 50 + i * 10, y: gravityMetrics(g, mass, 50 + i * 10).jumpHeight }))} marker={{ x: impulse, y: jumpHeight }} color="var(--bio)" />
              </div>
            </Panel>
            <WhatChangedPanel event={shown} spec={lastSpec} currentValue={lastSpec ? values[lastSpec.key] : undefined} />
            {shown && <ScienceNote title="Why did the motion change?" body={shown.reason} tryThis="Change only one variable, save an attempt and compare the measurements." />}
            {mode !== "explore" && <ScienceCoach observation={`Your explorer weighs ${weight.toFixed(1)} N and jumps ${jumpHeight.toFixed(2)} m.`} why="Weight equals mass times gravity. Jump height depends on take-off speed squared divided by twice gravity." suggestion={`Compare your world with ${GRAVITY_GOALS[goal].target} m/s² for this mission; several mass and push combinations can work.`} question="Would doubling mass change fall time or jump height with the same push?" muted={mode === "challenge"} />}
            {attempted && <ResultScorecard stars={Math.max(1, Math.min(5, Math.ceil(score / 20)))} rows={[{ label: "Mission match", value: `${score}%` }, { label: "Resource usage", value: `${energy.toFixed(0)} J per jump` }, { label: "Stability", value: g > 20 ? "High gravity" : "Gentle conditions" }, { label: "Scientific understanding", value: "Explain your comparison" }]} overall={score > 75 ? "Strong mission match!" : "Keep experimenting."} didWell="You recorded an attempt to compare with your next idea." improve="Change one variable at a time to separate its effect from the others." tryNext="Keep mass constant and compare Earth with the Moon." />}
            <BestSettings hasAttempt={attempted} specs={specs} values={values} onApplyAll={() => specs.forEach(s => apply(s.key))} onApplyOne={apply} expectedImprovement={`Mission match: ${score}% → ${gravityScore(goal, GRAVITY_GOALS[goal].target, 40, 200)}% with the suggested setup.`} why="These are comparison-friendly conditions for your chosen mission, not a universal perfect jump." />
            <CompareRuns current={snapshot()} runs={runs.runs} onSave={saveAttempt} onClear={runs.clear} onApplyRun={replayRun} />
            <ParameterTimeline history={lab.history} activeId={lab.selected?.id ?? null} onReplay={id => {
              const event = lab.history.find(e => e.id === id);
              if (!event || typeof event.to !== "number") return;
              setValue(event.key, event.to);
              lab.replay(id);
            }} />
            <Panel eyebrow="Scientific model" title="Gravity, not air resistance">
              <p className="text-sm text-muted-foreground">This educational model uses constant gravity and no air resistance. The drop starts from 10 m, and the pendulum uses a small-angle approximation. Jump impulse is the push accumulated over time, measured in N·s. Never try high-gravity training outside a simulation.</p>
            </Panel>
          </div>
        </div>
      </main>
    </div>
  );
}
