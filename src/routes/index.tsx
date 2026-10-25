import { createFileRoute, Link } from "@tanstack/react-router";
import { ParticleField } from "@/components/lab/ParticleField";
import { SiteHeader } from "@/components/lab/SiteHeader";
import { Panel } from "@/components/lab/Panel";
import { LAB_ROOMS } from "@/data/labs";
import { Rocket, FlaskConical, Sparkles, Trophy, Newspaper, Target } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Future Science Lab — Interactive Experiments for Ages 10–15" },
      {
        name: "description",
        content:
          "Perform impossible experiments in a futuristic virtual laboratory: volcanoes, rocket launches, gravity chambers and wind turbines with real physics.",
      },
      { property: "og:title", content: "Future Science Lab — Interactive Science for Kids" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content:
          "A holographic STEM laboratory where kids run real-physics simulations and learn by doing.",
      },
    ],
  }),
  component: Index,
});

const FEATURED = [
  {
    to: "/experiments/volcano",
    emoji: "🌋",
    title: "Volcano Eruption Simulator",
    desc: "Tune magma temperature, viscosity and gas pressure, then watch the eruption unfold.",
  },
  {
    to: "/experiments/rocket",
    emoji: "🚀",
    title: "Rocket Launch Simulator",
    desc: "Build a launch vehicle and fly it to orbit with live telemetry.",
  },
  {
    to: "/experiments/gravity",
    emoji: "🪐",
    title: "Gravity Chamber",
    desc: "Jump and bounce on the Moon, Mars, Jupiter or a planet you invent.",
  },
  {
    to: "/experiments/turbine",
    emoji: "⚡",
    title: "Wind Turbine Builder",
    desc: "Design blades and towers to squeeze the most power out of the wind.",
  },
] as const;

function Index() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main>
        <section
          className="relative overflow-hidden hud-grid"
          style={{ backgroundImage: "var(--gradient-hero)" }}
        >
          <ParticleField density={70} />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl animate-pulse-glow" />
          <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:py-32">
            <p className="font-display text-xs tracking-[0.4em] text-primary uppercase">
              Mission Control · Online
            </p>
            <h1 className="mt-5 text-4xl font-bold sm:text-6xl glow-text">
              Welcome to Future Science Lab
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Perform Impossible Experiments. Explore the Universe. Learn by Doing.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                to="/lab"
                className="rounded-full bg-primary px-6 py-3 font-display text-sm tracking-wider text-primary-foreground uppercase neon-ring transition-transform hover:scale-105"
              >
                Start Exploring
              </Link>
              <Link
                to="/lab"
                className="rounded-full border border-primary/50 px-6 py-3 font-display text-sm tracking-wider text-primary uppercase transition-colors hover:bg-primary/15"
              >
                Enter Science Lab
              </Link>
              <Link
                to="/experiments/volcano"
                className="rounded-full border border-accent/50 px-6 py-3 font-display text-sm tracking-wider text-accent uppercase transition-colors hover:bg-accent/15"
              >
                Meet AI Scientist
              </Link>
            </div>

            <div className="mt-16 flex justify-center">
              <div className="relative h-40 w-40">
                <div className="absolute inset-0 rounded-full border border-primary/40 animate-orbit-spin">
                  <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-primary" />
                </div>
                <div
                  className="absolute inset-5 rounded-full border border-accent/40 animate-orbit-spin"
                  style={{ animationDirection: "reverse", animationDuration: "11s" }}
                >
                  <span className="absolute -top-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-accent" />
                </div>
                <div className="absolute inset-[38%] rounded-full bg-primary/70 blur-[2px] animate-pulse-glow" />
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-8 px-4 py-14">
          <section aria-labelledby="featured">
            <h2 id="featured" className="mb-4 font-display text-xl tracking-wide">
              Featured Experiments
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURED.map((f) => (
                <Link
                  key={f.to}
                  to={f.to}
                  className="glass-panel group p-5 transition-transform hover:-translate-y-1 hover:neon-ring"
                >
                  <span className="text-3xl">{f.emoji}</span>
                  <h3 className="mt-3 text-base font-semibold group-hover:text-primary">
                    {f.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel eyebrow="Daily Challenge" title="Escape Velocity Run">
              <p className="text-sm text-muted-foreground">
                Reach a stable orbit using less than 60% of your fuel in the Rocket Launch
                Simulator.
              </p>
              <Link
                to="/experiments/rocket"
                className="mt-4 inline-flex items-center gap-2 text-sm text-primary"
              >
                <Rocket className="h-4 w-4" aria-hidden="true" /> Accept challenge
              </Link>
            </Panel>
            <Panel eyebrow="Weekly Mission" title="Volcano Watch">
              <p className="text-sm text-muted-foreground">
                Produce one effusive and one explosive eruption, then explain the difference in your
                mission report.
              </p>
              <Link
                to="/experiments/volcano"
                className="mt-4 inline-flex items-center gap-2 text-sm text-magma"
              >
                <FlaskConical className="h-4 w-4" aria-hidden="true" /> Start mission
              </Link>
            </Panel>
            <Panel eyebrow="Today's Quiz" title="Which planet pulls hardest?">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>· Compare jump height on the Moon and Jupiter</li>
                <li>· Predict before you test — then check your answer</li>
              </ul>
              <Link
                to="/experiments/gravity"
                className="mt-4 inline-flex items-center gap-2 text-sm text-accent"
              >
                <Target className="h-4 w-4" aria-hidden="true" /> Take the quiz
              </Link>
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel eyebrow="Recently added" title="New in the lab">
              <ul className="space-y-3 text-sm">
                {FEATURED.map((f) => (
                  <li key={f.title} className="flex items-center gap-3">
                    <span aria-hidden="true">{f.emoji}</span>
                    <Link to={f.to} className="text-muted-foreground hover:text-primary">
                      {f.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel eyebrow="Science news for kids" title="Signals from the field">
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <Newspaper className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  Volcanologists use drones to measure gas above craters — safely, from a distance.
                </li>
                <li className="flex gap-2">
                  <Newspaper className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  Reusable rockets land themselves by relighting engines in the final seconds.
                </li>
                <li className="flex gap-2">
                  <Newspaper className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  Offshore turbines now have blades longer than a football pitch.
                </li>
              </ul>
            </Panel>
            <Panel eyebrow="Achievements" title="Showcase">
              <div className="grid grid-cols-2 gap-3">
                {["Explorer", "Lab Rookie", "Orbit Maker", "Gravity Bender"].map((b) => (
                  <div
                    key={b}
                    className="rounded-xl border border-border bg-secondary/30 px-3 py-3 text-center"
                  >
                    <Trophy className="mx-auto h-5 w-5 text-primary" aria-hidden="true" />
                    <p className="mt-1 text-xs text-muted-foreground">{b}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <section aria-labelledby="rooms">
            <h2 id="rooms" className="mb-4 font-display text-xl tracking-wide">
              Virtual Science Laboratory
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {LAB_ROOMS.map((r) => (
                <Link
                  key={r.slug}
                  to="/lab"
                  className="glass-panel p-4 text-center transition-transform hover:-translate-y-1"
                >
                  <span className="text-2xl">{r.emoji}</span>
                  <p className="mt-2 text-sm font-medium">{r.name}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p className="flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          Future Science Lab — educational simulations for curious minds aged 10–15.
        </p>
      </footer>
    </div>
  );
}
