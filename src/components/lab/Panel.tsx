import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  eyebrow,
  right,
  className,
  children,
}: {
  title?: string;
  eyebrow?: string;
  right?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("glass-panel p-5", className)}>
      {(title || right) && (
        <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            {eyebrow && (
              <p className="font-display text-[0.65rem] tracking-[0.3em] text-primary uppercase">
                {eyebrow}
              </p>
            )}
            {title && <h2 className="truncate text-lg font-semibold">{title}</h2>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function Control({
  label,
  value,
  unit,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  const id = `ctl-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <label htmlFor={id} className="text-muted-foreground">
          {label}
        </label>
        <span className="font-display text-primary tabular-nums">
          {value}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}

export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm text-muted-foreground">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              value === o.value
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:bg-secondary/60",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function Readout({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: string;
  tone?: "primary" | "accent" | "bio" | "magma";
}) {
  const toneClass = {
    primary: "text-primary",
    accent: "text-accent",
    bio: "text-bio",
    magma: "text-magma",
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2">
      <p className="text-[0.7rem] tracking-widest text-muted-foreground uppercase">{label}</p>
      <p className={cn("font-display text-lg tabular-nums", toneClass)}>{value}</p>
    </div>
  );
}

export function MissionReport({
  score,
  summary,
  why,
  improve,
  realWorld,
  fact,
}: {
  score: number;
  summary: string;
  why: string;
  improve: string;
  realWorld: string;
  fact: string;
}) {
  const rows = [
    { k: "What happened?", v: summary },
    { k: "Why did it happen?", v: why },
    { k: "What could be improved?", v: improve },
    { k: "Real-life application", v: realWorld },
    { k: "Fun science fact", v: fact },
  ];
  return (
    <Panel
      eyebrow="Smart result analysis"
      title="Mission Report"
      className="scanline"
      right={
        <div className="text-right">
          <p className="text-[0.7rem] tracking-widest text-muted-foreground uppercase">Score</p>
          <p className="font-display text-2xl text-primary glow-text">{score}</p>
        </div>
      }
    >
      <dl className="space-y-3">
        {rows.map((r) => (
          <div key={r.k}>
            <dt className="font-display text-xs tracking-widest text-accent uppercase">{r.k}</dt>
            <dd className="text-sm text-muted-foreground">{r.v}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
