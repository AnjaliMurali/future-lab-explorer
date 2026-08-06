import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/lab/SiteHeader";
import { Panel, Control, Choice, Readout, MissionReport } from "@/components/lab/Panel";

export const Route = createFileRoute("/experiments/volcano")({
  head: () => ({
    meta: [
      { title: "Volcano Eruption Simulator — Future Science Lab" },
      {
        name: "description",
        content:
          "Change magma temperature, viscosity, gas pressure and crater width, then watch lava, ash and smoke behave like the real thing.",
      },
      { property: "og:title", content: "Volcano Eruption Simulator" },
      {
        property: "og:description",
        content: "Interactive eruption physics for young scientists.",
      },
    ],
  }),
  component: VolcanoPage,
});

type Rock = "basalt" | "andesite" | "rhyolite";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  kind: "lava" | "ash" | "smoke";
  size: number;
};

function VolcanoPage() {
  const [temp, setTemp] = useState(1100);
  const [viscosity, setViscosity] = useState(35);
  const [pressure, setPressure] = useState(50);
  const [height, setHeight] = useState(1800);
  const [crater, setCrater] = useState(220);
  const [rock, setRock] = useState<Rock>("basalt");
  const [erupting, setErupting] = useState(false);

  // Rock composition nudges silica content, which drives viscosity in real magma.
  const silica = { basalt: 50, andesite: 60, rhyolite: 72 }[rock];
  const effectiveViscosity = Math.min(100, viscosity + (silica - 50) * 1.1 - (temp - 1100) / 20);
  const explosivity = Math.max(
    0,
    Math.min(100, Math.round(pressure * 0.6 + effectiveViscosity * 0.5 - (temp - 900) / 25)),
  );
  const style =
    explosivity > 68 ? "Plinian (explosive)" : explosivity > 38 ? "Strombolian" : "Effusive";
  const lavaSpeed = Math.max(0.2, (12 - effectiveViscosity / 10) * (temp / 1100)).toFixed(1);
  const ashHeight = Math.round((explosivity / 100) * 22 + 1);
  const score = Math.round(60 + explosivity / 4 + (crater / 400) * 15);

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

    const draw = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, w, h);

      // Volcano cone
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

      // Glowing magma chamber
      ctx.beginPath();
      ctx.ellipse(w / 2, baseY - 4, craterHalf * 2.2, 16, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,${120 + (s.temp - 900) / 6},40,0.18)`;
      ctx.fill();

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
          p.x += p.vx;
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
        <p className="font-display text-xs tracking-[0.4em] text-magma uppercase">
          Earth Science Lab
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Volcano Eruption Simulator</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Magma is molten rock full of dissolved gas. How hot it is, how thick it is, and how much
          gas it holds decide whether a volcano oozes or explodes.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Panel eyebrow="Control console" title="Parameters">
            <div className="space-y-4">
              <Control
                label="Magma temperature"
                value={temp}
                unit="°C"
                min={700}
                max={1300}
                step={10}
                onChange={setTemp}
              />
              <Control
                label="Lava viscosity"
                value={viscosity}
                unit="idx"
                min={0}
                max={100}
                onChange={setViscosity}
              />
              <Control
                label="Gas pressure"
                value={pressure}
                unit="MPa"
                min={0}
                max={100}
                onChange={setPressure}
              />
              <Control
                label="Volcano height"
                value={height}
                unit="m"
                min={400}
                max={4000}
                step={50}
                onChange={setHeight}
              />
              <Control
                label="Crater width"
                value={crater}
                unit="m"
                min={50}
                max={400}
                step={10}
                onChange={setCrater}
              />
              <Choice
                label="Rock composition"
                value={rock}
                onChange={setRock}
                options={[
                  { value: "basalt", label: "Basalt" },
                  { value: "andesite", label: "Andesite" },
                  { value: "rhyolite", label: "Rhyolite" },
                ]}
              />
              <div className="flex gap-2 pt-2">
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
                    setHeight(1800);
                    setCrater(220);
                    setRock("basalt");
                  }}
                  className="rounded-full border border-border px-4 py-2 font-display text-xs tracking-widest uppercase"
                >
                  Reset
                </button>
              </div>
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel eyebrow="Live simulation" title={`Eruption style: ${style}`} className="p-3">
              <canvas
                ref={canvasRef}
                aria-label="Animated volcano eruption simulation"
                role="img"
                className="h-[380px] w-full rounded-xl bg-gradient-to-b from-[oklch(0.18_0.06_275)] to-[oklch(0.12_0.04_265)] hud-grid"
              />
            </Panel>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Readout label="Explosivity" value={`${explosivity}/100`} tone="magma" />
              <Readout label="Lava flow speed" value={`${lavaSpeed} m/s`} />
              <Readout label="Ash column" value={`${ashHeight} km`} tone="accent" />
              <Readout label="Silica" value={`${silica}%`} tone="bio" />
            </div>
            <MissionReport
              score={score}
              summary={`Your ${rock} magma at ${temp}°C produced a ${style.toLowerCase()} eruption with an ash column near ${ashHeight} km.`}
              why={`Gas pressure pushes magma upward. Thick (viscous) magma traps gas bubbles until they burst — that is why ${
                silica > 65 ? "high-silica rhyolite explodes" : "runny basalt usually flows quietly"
              }. Raising temperature thins magma and calms the eruption.`}
              improve={
                explosivity > 68
                  ? "Lower gas pressure or raise temperature to see a gentle lava flow instead."
                  : "Raise gas pressure and pick rhyolite to trigger an explosive Plinian column."
              }
              realWorld={
                silica > 65
                  ? "Mount St. Helens (1980) erupted explosively from sticky, gas-rich magma."
                  : "Kīlauea in Hawai'i produces slow, runny basalt lava rivers."
              }
              fact="Volcanic ash is not soft — it is tiny shards of volcanic glass, which is why aircraft avoid ash clouds."
            />
            <Panel eyebrow="Safety" title="Field rules">
              <p className="text-sm text-muted-foreground">
                Real volcanoes are dangerous. Scientists watch them from a safe distance using
                drones, satellites and seismometers, and always follow official exclusion zones.
                This simulation is a simplified educational model.
              </p>
            </Panel>
          </div>
        </div>
      </main>
    </div>
  );
}
