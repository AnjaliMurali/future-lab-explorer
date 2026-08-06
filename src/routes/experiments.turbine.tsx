import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/lab/SiteHeader";
import { Panel, Control, Choice, Readout, MissionReport } from "@/components/lab/Panel";

export const Route = createFileRoute("/experiments/turbine")({
  head: () => ({
    meta: [
      { title: "Wind Turbine Builder — Future Science Lab" },
      {
        name: "description",
        content:
          "Design blades, towers and generators, then measure real power output, efficiency, cost and environmental impact.",
      },
      { property: "og:title", content: "Wind Turbine Builder" },
      { property: "og:description", content: "Engineer a turbine and measure its power output." },
    ],
  }),
  component: TurbinePage,
});

type Shape = "flat" | "curved" | "twisted";

function TurbinePage() {
  const [blade, setBlade] = useState(35);
  const [shape, setShape] = useState<Shape>("curved");
  const [windSpeed, setWindSpeed] = useState(10);
  const [generator, setGenerator] = useState(2000);
  const [tower, setTower] = useState(80);

  // Wind shear: higher towers reach faster, smoother wind.
  const hubWind = windSpeed * Math.pow(tower / 10, 0.14);
  const cp = { flat: 0.22, curved: 0.42, twisted: 0.48 }[shape];
  const area = Math.PI * blade * blade;
  const rawKw = (0.5 * 1.225 * area * Math.pow(hubWind, 3) * cp) / 1000;
  const powerKw = Math.min(generator, rawKw);
  const efficiency = Math.round((powerKw / Math.max(1, rawKw)) * cp * 100);
  const cost = Math.round((blade * 26 + tower * 9 + generator * 0.7) / 10) / 100;
  const homes = Math.round((powerKw * 8760 * 0.35) / 3500);
  const spin = Math.max(0.6, 6 - hubWind / 4);
  const capped = rawKw > generator;

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <p className="font-display text-xs tracking-[0.4em] text-bio uppercase">Energy Lab</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Wind Turbine Builder</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Wind power grows with the cube of wind speed and the square of blade length. Small design
          choices make enormous differences.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Panel eyebrow="Design console" title="Turbine spec">
            <div className="space-y-4">
              <Control
                label="Blade length"
                value={blade}
                unit="m"
                min={5}
                max={110}
                onChange={setBlade}
              />
              <Choice
                label="Blade shape"
                value={shape}
                onChange={setShape}
                options={[
                  { value: "flat", label: "Flat" },
                  { value: "curved", label: "Curved airfoil" },
                  { value: "twisted", label: "Twisted airfoil" },
                ]}
              />
              <Control
                label="Wind speed"
                value={windSpeed}
                unit="m/s"
                min={1}
                max={25}
                onChange={setWindSpeed}
              />
              <Control
                label="Generator size"
                value={generator}
                unit="kW"
                min={100}
                max={8000}
                step={100}
                onChange={setGenerator}
              />
              <Control
                label="Tower height"
                value={tower}
                unit="m"
                min={10}
                max={180}
                step={5}
                onChange={setTower}
              />
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel
              eyebrow="Live simulation"
              title={capped ? "Generator at rated limit" : "Turbine running"}
            >
              <div className="relative h-[380px] overflow-hidden rounded-xl bg-gradient-to-b from-[oklch(0.2_0.06_250)] to-[oklch(0.3_0.07_200)] hud-grid">
                <svg
                  viewBox="0 0 300 300"
                  className="h-full w-full"
                  role="img"
                  aria-label={`Wind turbine with ${blade} metre blades spinning in ${windSpeed} metres per second wind`}
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
                        width="6"
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
              </div>
            </Panel>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Readout label="Power output" value={`${powerKw.toFixed(0)} kW`} tone="bio" />
              <Readout label="Efficiency" value={`${efficiency}%`} />
              <Readout label="Homes powered" value={`${homes}`} tone="accent" />
              <Readout label="Est. cost" value={`$${cost}M`} tone="magma" />
            </div>

            <MissionReport
              score={Math.round(Math.min(100, 40 + efficiency + powerKw / 200))}
              summary={`Your ${blade} m ${shape} blades on an ${tower} m tower generate about ${powerKw.toFixed(0)} kW in ${windSpeed} m/s wind — enough for roughly ${homes} homes.`}
              why={`Doubling blade length quadruples the swept area, and doubling wind speed gives eight times the power. A ${shape} blade captures about ${Math.round(cp * 100)}% of the wind's energy${capped ? ", but your generator is capping the output" : ""}.`}
              improve={
                capped
                  ? "Fit a bigger generator, or trim the blades — you are throwing energy away."
                  : "Raise the tower to catch faster, smoother wind, or switch to twisted airfoil blades."
              }
              realWorld="Offshore turbines use very long twisted blades and tall towers because sea wind is fast and steady."
              fact="No turbine can capture more than 59.3% of the wind's energy — that limit is called Betz's law."
            />

            <Panel eyebrow="Environment" title="Impact notes">
              <p className="text-sm text-muted-foreground">
                Wind power produces no fuel emissions while running, but turbines need land or
                seabed, and engineers plan sites carefully to protect birds and bats.
              </p>
            </Panel>
          </div>
        </div>
      </main>
    </div>
  );
}
