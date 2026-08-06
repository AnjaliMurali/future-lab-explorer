import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/lab/SiteHeader";
import { Panel, Control, Choice, Readout, MissionReport } from "@/components/lab/Panel";

export const Route = createFileRoute("/experiments/gravity")({
  head: () => ({
    meta: [
      { title: "Gravity Chamber — Future Science Lab" },
      {
        name: "description",
        content:
          "Drop balls, jump and swing pendulums on the Moon, Mars, Jupiter or a planet you invent, and see how gravity changes everything.",
      },
      { property: "og:title", content: "Gravity Chamber" },
      { property: "og:description", content: "Compare gravity across worlds in real time." },
    ],
  }),
  component: GravityPage,
});

const PLANETS = {
  earth: { label: "Earth", g: 9.81 },
  moon: { label: "Moon", g: 1.62 },
  mars: { label: "Mars", g: 3.72 },
  jupiter: { label: "Jupiter", g: 24.79 },
  custom: { label: "Custom Planet", g: 6 },
} as const;

type PlanetKey = keyof typeof PLANETS;

function GravityPage() {
  const [planet, setPlanet] = useState<PlanetKey>("moon");
  const [customG, setCustomG] = useState(6);
  const [mass, setMass] = useState(40);
  const [jumpForce, setJumpForce] = useState(600);

  const g = planet === "custom" ? customG : PLANETS[planet].g;
  const jumpVel = jumpForce / Math.max(5, mass);
  const jumpHeight = (jumpVel * jumpVel) / (2 * Math.max(0.1, g));
  const hangTime = (2 * jumpVel) / Math.max(0.1, g);
  const pendulum = 2 * Math.PI * Math.sqrt(1 / Math.max(0.1, g));
  const weight = mass * g;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sim = useRef({ g, jumpVel });
  sim.current = { g, jumpVel };

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

    let ballY = 40;
    let ballV = 0;
    let jumperY = 0;
    let jumperV = 0;
    let theta = 0.6;
    let omega = 0;
    let raf = 0;

    const draw = () => {
      const { g: gg, jumpVel: jv } = sim.current;
      const dt = 1 / 60;
      const floor = h - 30;
      const px = 12; // pixels per metre

      // Falling ball
      ballV += gg * dt * px;
      ballY += ballV * dt;
      if (ballY > floor - 12) {
        ballY = floor - 12;
        ballV = -ballV * 0.72;
        if (Math.abs(ballV) < 12) {
          ballY = 40;
          ballV = 0;
        }
      }

      // Jumper
      jumperV -= gg * dt * px;
      jumperY += jumperV * dt;
      if (jumperY <= 0) {
        jumperY = 0;
        jumperV = jv * px * 0.55;
      }

      // Pendulum
      omega += (-gg / 1.2) * Math.sin(theta) * dt;
      omega *= 0.999;
      theta += omega * dt;

      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(120,220,255,0.35)";
      ctx.beginPath();
      ctx.moveTo(0, floor);
      ctx.lineTo(w, floor);
      ctx.stroke();

      // ball
      ctx.beginPath();
      ctx.arc(w * 0.2, ballY, 12, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(120,220,255,0.9)";
      ctx.fill();

      // jumper
      ctx.beginPath();
      ctx.roundRect(w * 0.48 - 9, floor - 32 - jumperY, 18, 32, 6);
      ctx.fillStyle = "rgba(190,140,255,0.9)";
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
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(bx, by, 11, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(140,255,190,0.9)";
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <p className="font-display text-xs tracking-[0.4em] text-accent uppercase">Physics Lab</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Gravity Chamber</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Gravity does not change how much stuff you are made of — it changes how strongly you are
          pulled. Switch worlds and watch the same body behave completely differently.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Panel eyebrow="Chamber console" title="Conditions">
            <div className="space-y-4">
              <Choice
                label="World"
                value={planet}
                onChange={setPlanet}
                options={(Object.keys(PLANETS) as PlanetKey[]).map((k) => ({
                  value: k,
                  label: PLANETS[k].label,
                }))}
              />
              {planet === "custom" && (
                <Control
                  label="Gravity strength"
                  value={customG}
                  unit="m/s²"
                  min={0.5}
                  max={30}
                  step={0.1}
                  onChange={setCustomG}
                />
              )}
              <Control label="Mass" value={mass} unit="kg" min={10} max={120} onChange={setMass} />
              <Control
                label="Jump force"
                value={jumpForce}
                unit="N"
                min={200}
                max={1500}
                step={10}
                onChange={setJumpForce}
              />
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel eyebrow="Live simulation" title={`${PLANETS[planet].label} · g = ${g} m/s²`}>
              <canvas
                ref={canvasRef}
                role="img"
                aria-label="Animated gravity chamber with a bouncing ball, a jumper and a pendulum"
                className="h-[380px] w-full rounded-xl bg-gradient-to-b from-[oklch(0.14_0.05_270)] to-[oklch(0.2_0.06_260)] hud-grid"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Left: bouncing ball · Middle: jumper · Right: 1.2 m pendulum
              </p>
            </Panel>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Readout label="Jump height" value={`${jumpHeight.toFixed(2)} m`} />
              <Readout label="Hang time" value={`${hangTime.toFixed(2)} s`} tone="accent" />
              <Readout label="Weight" value={`${weight.toFixed(0)} N`} tone="magma" />
              <Readout label="Pendulum period" value={`${pendulum.toFixed(2)} s`} tone="bio" />
            </div>

            <MissionReport
              score={Math.round(65 + Math.min(30, jumpHeight * 6))}
              summary={`On ${PLANETS[planet].label} a ${mass} kg explorer jumping with ${jumpForce} N rises about ${jumpHeight.toFixed(2)} m and stays airborne ${hangTime.toFixed(2)} s.`}
              why="Jump height depends on take-off speed squared divided by twice gravity. Weaker gravity means slower slowing down, so you rise higher and float longer."
              improve={
                g > 10
                  ? "Try the Moon: with 1.62 m/s² the same push sends you six times higher."
                  : "Try Jupiter and see how the same jump barely lifts you off the ground."
              }
              realWorld="Astronauts train underwater because buoyancy imitates the floaty feel of low gravity."
              fact="Your mass is the same everywhere, but on the Moon your weight is only about one sixth of Earth's."
            />
          </div>
        </div>
      </main>
    </div>
  );
}
