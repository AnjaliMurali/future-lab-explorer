import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/lab/SiteHeader";
import { ParticleField } from "@/components/lab/ParticleField";
import { LAB_ROOMS } from "@/data/labs";

export const Route = createFileRoute("/lab")({
  head: () => ({
    meta: [
      { title: "Virtual Science Laboratory — Future Science Lab" },
      {
        name: "description",
        content:
          "Step into ten futuristic science rooms — Earth, Space, Physics, Energy, Biology and more — and launch interactive experiments.",
      },
      { property: "og:title", content: "Virtual Science Laboratory" },
      {
        property: "og:description",
        content: "Ten holographic science rooms full of interactive equipment.",
      },
    ],
  }),
  component: LabPage,
});

function LabPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="relative overflow-hidden hud-grid">
        <ParticleField density={45} />
        <div className="relative mx-auto max-w-7xl px-4 py-14">
          <p className="font-display text-xs tracking-[0.4em] text-primary uppercase">
            Facility map
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Virtual Science Laboratory</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Choose a room, then click a piece of equipment to launch its simulation. Every
            experiment runs on real scientific principles you can poke, tune and break.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {LAB_ROOMS.map((room) => (
              <article key={room.slug} className="glass-panel relative overflow-hidden p-5">
                <div
                  className={`pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br ${room.accent} to-transparent blur-2xl`}
                />
                <div className="relative flex min-w-0 items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-border bg-secondary/40 text-2xl animate-float-slow">
                    {room.emoji}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold">{room.name}</h2>
                    <p className="truncate text-sm text-muted-foreground">{room.blurb}</p>
                  </div>
                </div>
                <ul className="relative mt-4 space-y-2">
                  {room.experiments.map((e) =>
                    e.to ? (
                      <li key={e.title}>
                        <Link
                          to={e.to}
                          className="flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary transition-colors hover:bg-primary/20"
                        >
                          <span className="truncate">{e.title}</span>
                          <span className="shrink-0 text-[0.65rem] tracking-widest uppercase">
                            {e.note}
                          </span>
                        </Link>
                      </li>
                    ) : (
                      <li
                        key={e.title}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/25 px-3 py-2 text-sm text-muted-foreground"
                      >
                        <span className="truncate">{e.title}</span>
                        <span className="shrink-0 text-[0.65rem] tracking-widest uppercase">
                          {e.note}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
