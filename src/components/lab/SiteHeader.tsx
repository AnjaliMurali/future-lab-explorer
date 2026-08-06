import { Link } from "@tanstack/react-router";
import { Atom } from "lucide-react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/lab", label: "Virtual Lab" },
  { to: "/experiments/volcano", label: "Volcano" },
  { to: "/experiments/rocket", label: "Rocket" },
  { to: "/experiments/gravity", label: "Gravity" },
  { to: "/experiments/turbine", label: "Turbine" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
      <nav
        aria-label="Main"
        className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3"
      >
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/40 bg-primary/10 text-primary">
            <Atom className="h-5 w-5 animate-orbit-spin" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-sm tracking-[0.2em] uppercase">
              Future Science Lab
            </span>
            <span className="block text-xs text-muted-foreground">Mission Control</span>
          </span>
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <li key={n.to}>
              <Link
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                activeProps={{ className: "bg-primary/15 text-primary" }}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/60"
              >
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          to="/lab"
          className="rounded-full border border-primary/50 bg-primary/15 px-4 py-1.5 text-sm text-primary transition-colors hover:bg-primary/25 md:hidden"
        >
          Enter Lab
        </Link>
      </nav>
    </header>
  );
}
