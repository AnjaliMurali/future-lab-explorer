import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/lab/SiteHeader";
import { Panel, Control, Choice, Readout, MissionReport } from "@/components/lab/Panel";

export const Route = createFileRoute("/experiments/rocket")({
  head: () => ({
    meta: [
      { title: "Rocket Launch Simulator — Future Science Lab" },
      {
        name: "description",
        content:
          "Pick your rocket, fuel, payload and launch angle, then fly a real-physics mission from countdown to orbit insertion.",
      },
      { property: "og:title", content: "Rocket Launch Simulator" },
      {
        property: "og:description",
        content: "Countdown, ignition, staging and orbit — with live telemetry.",
      },
    ],
  }),
  component: RocketPage,
});

type Phase = "idle" | "countdown" | "ascent" | "done";

function RocketPage() {
  const [thrust, setThrust] = useState(70);
  const [fuel, setFuel] = useState(80);
  const [payload, setPayload] = useState(20);
  const [angle, setAngle] = useState(82);
  const [wind, setWind] = useState(10);
  const [engine, setEngine] = useState<"kerolox" | "hydrolox" | "solid">("kerolox");

  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(5);
  const [tel, setTel] = useState({ alt: 0, vel: 0, fuelLeft: fuel, t: 0, stage: 1 });
  const [result, setResult] = useState<null | { ok: boolean; text: string }>(null);
  const raf = useRef(0);

  const isp = { kerolox: 300, hydrolox: 440, solid: 250 }[engine];
  const escapeVel = 11.2;

  const reset = () => {
    cancelAnimationFrame(raf.current);
    setPhase("idle");
    setCount(5);
    setResult(null);
    setTel({ alt: 0, vel: 0, fuelLeft: fuel, t: 0, stage: 1 });
  };

  const launch = () => {
    setResult(null);
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
    const mass0 = 40 + payload;

    const step = () => {
      const dt = 0.08;
      t += dt;
      const burning = fuelLeft > 0;
      if (burning) fuelLeft = Math.max(0, fuelLeft - (thrust / 100) * 1.1 * dt * 10);
      if (stage === 1 && fuelLeft < fuel * 0.45) stage = 2;

      const mass = mass0 * (0.35 + (fuelLeft / 100) * 0.65) * (stage === 2 ? 0.7 : 1);
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

      if (alt >= 200 && vel > 0) {
        setPhase("done");
        setResult({
          ok: true,
          text: `Orbit insertion confirmed at ${Math.round(alt)} km with ${Math.round(fuelLeft)}% fuel remaining.`,
        });
        return;
      }
      if ((alt <= 0 && t > 2) || t > 90) {
        setPhase("done");
        setResult({
          ok: false,
          text:
            fuelLeft <= 0
              ? "Fuel exhausted before orbital altitude — the rocket fell back to Earth."
              : "The vehicle never built enough vertical speed to reach orbit.",
        });
        return;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [phase, thrust, fuel, payload, angle, wind, isp]);

  const altPct = Math.min(100, (tel.alt / 200) * 100);
  const score = result?.ok ? Math.round(70 + tel.fuelLeft / 4) : Math.round(30 + altPct / 4);

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <p className="font-display text-xs tracking-[0.4em] text-primary uppercase">Space Lab</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Rocket Launch Simulator</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          A rocket must push harder than gravity pulls. Thrust, mass and fuel decide whether you
          reach orbit — or take a very expensive fall.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Panel eyebrow="Flight console" title="Vehicle setup">
            <div className="space-y-4">
              <Choice
                label="Engine / fuel"
                value={engine}
                onChange={setEngine}
                options={[
                  { value: "kerolox", label: "Kerosene + LOX" },
                  { value: "hydrolox", label: "Hydrogen + LOX" },
                  { value: "solid", label: "Solid booster" },
                ]}
              />
              <Control
                label="Engine power"
                value={thrust}
                unit="%"
                min={20}
                max={100}
                onChange={setThrust}
              />
              <Control label="Fuel load" value={fuel} unit="%" min={20} max={100} onChange={setFuel} />
              <Control
                label="Payload mass"
                value={payload}
                unit="t"
                min={1}
                max={60}
                onChange={setPayload}
              />
              <Control
                label="Launch angle"
                value={angle}
                unit="°"
                min={45}
                max={90}
                onChange={setAngle}
              />
              <Control
                label="Wind speed"
                value={wind}
                unit="km/h"
                min={0}
                max={80}
                onChange={setWind}
              />
              <div className="flex gap-2 pt-2">
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
                  className="absolute left-1/2 -translate-x-1/2 transition-[bottom] duration-100"
                  style={{ bottom: `${8 + altPct * 0.8}%` }}
                >
                  <div className="text-3xl" aria-hidden="true">
                    🚀
                  </div>
                  {phase === "ascent" && tel.fuelLeft > 0 && (
                    <div className="mx-auto h-10 w-2 rounded-full bg-gradient-to-b from-magma to-transparent blur-[1px] animate-pulse-glow" />
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 h-8 bg-[oklch(0.25_0.05_150)]" />
              </div>
            </Panel>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Readout label="Altitude" value={`${tel.alt} km`} />
              <Readout label="Velocity" value={`${tel.vel} km/s·idx`} tone="accent" />
              <Readout label="Fuel" value={`${tel.fuelLeft}%`} tone="magma" />
              <Readout label="Escape velocity" value={`${escapeVel} km/s`} tone="bio" />
            </div>

            {result && (
              <MissionReport
                score={score}
                summary={result.text}
                why={`Your ${engine} engine has a specific impulse near ${isp}s, so each kilogram of fuel gives ${
                  isp > 350 ? "a lot" : "a moderate amount"
                } of push. With ${payload}t of payload, ${thrust}% power ${
                  result.ok ? "was enough" : "was not enough"
                } to beat gravity long enough.`}
                improve={
                  result.ok
                    ? "Try a heavier payload or a lower angle and see how the margin shrinks."
                    : "Increase engine power, reduce payload, or switch to hydrogen fuel for more efficiency."
                }
                realWorld="Rockets drop empty stages so they stop carrying dead weight — exactly what your stage separation did."
                fact="Reaching orbit is mostly about sideways speed, not height: about 28,000 km/h at low Earth orbit."
              />
            )}

            <Panel eyebrow="Safety" title="Launch range rules">
              <p className="text-sm text-muted-foreground">
                Real launches keep everyone kilometres away, hold for bad weather, and can abort at
                any second. This simulation is a simplified educational model of rocket flight.
              </p>
            </Panel>
          </div>
        </div>
      </main>
    </div>
  );
}
