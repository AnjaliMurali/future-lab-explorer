import { useId, useState } from "react";
import { ZONE_META, verdict, type ParamSpec } from "@/lib/param-lab";
import { cn } from "@/lib/utils";

export function StatusBadge({
  tone,
  compact,
}: {
  tone: keyof typeof ZONE_META;
  compact?: boolean;
}) {
  const m = ZONE_META[tone];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.7rem] font-medium"
      style={{ borderColor: m.color, color: m.color, background: `color-mix(in oklab, ${m.color} 14%, transparent)` }}
    >
      <span aria-hidden="true">{m.icon}</span>
      {compact ? m.label : m.status}
    </span>
  );
}

export function ZoneSlider({
  spec,
  value,
  onChange,
  onCommit,
}: {
  spec: ParamSpec;
  value: number;
  onChange: (v: number) => void;
  /** called with (previous, next) once the student finishes dragging */
  onCommit: (from: number, to: number) => void;
}) {
  const id = useId();
  const [start, setStart] = useState(value);
  const [open, setOpen] = useState(false);
  const { zone, meta, optimal, relation } = verdict(spec, value);
  const pct = (v: number) => ((v - spec.min) / (spec.max - spec.min)) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <label htmlFor={id} className="flex items-center gap-1.5 text-muted-foreground">
          <span aria-hidden="true">{spec.icon}</span>
          {spec.label}
        </label>
        <span className="font-display tabular-nums" style={{ color: meta.color }}>
          {value}
          {spec.unit ? ` ${spec.unit}` : ""}
        </span>
      </div>

      <div className="relative">
        <div className="flex h-2.5 w-full overflow-hidden rounded-full" aria-hidden="true">
          {spec.zones.map((z) => {
            const m = ZONE_META[z.tone];
            return (
              <span
                key={`${z.from}-${z.to}-${z.tone}`}
                title={m.label}
                style={{
                  width: `${((z.to - z.from) / (spec.max - spec.min)) * 100}%`,
                  background: m.striped
                    ? `repeating-linear-gradient(45deg, color-mix(in oklab, ${m.color} 45%, transparent) 0 5px, color-mix(in oklab, ${m.color} 18%, transparent) 5px 10px)`
                    : `color-mix(in oklab, ${m.color} ${z.tone === "optimal" ? 65 : 32}%, transparent)`,
                }}
              />
            );
          })}
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-1 text-[0.6rem]"
          style={{ left: `calc(${pct(spec.suggested)}% - 5px)` }}
          title="Suggested value"
        >
          ⭐
        </span>
        <input
          id={id}
          type="range"
          min={spec.min}
          max={spec.max}
          step={spec.step ?? 1}
          value={value}
          aria-describedby={`${id}-status`}
          onPointerDown={() => setStart(value)}
          onKeyDown={() => setStart(value)}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerUp={() => onCommit(start, value)}
          onKeyUp={() => onCommit(start, value)}
          onBlur={() => onCommit(start, value)}
          className="absolute inset-x-0 -top-1 h-4 w-full cursor-pointer appearance-none bg-transparent accent-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id={`${id}-status`} className="flex items-center gap-2 text-xs">
          <StatusBadge tone={zone.tone} />
          <span className="text-muted-foreground">
            {zone.tone === "optimal" ? "In the sweet spot" : relation}
          </span>
        </p>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="text-xs text-primary underline underline-offset-4"
        >
          {open ? "Hide guide" : "What does this do?"}
        </button>
      </div>

      {open && (
        <div className="animate-fade-in rounded-xl border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
          <p className="text-foreground">{spec.reason}</p>
          <p className="mt-2">
            <span className="text-bio">⭐ Optimal range:</span> {optimal} · suggested{" "}
            {spec.suggested}
            {spec.unit ? ` ${spec.unit}` : ""}
          </p>
          <ul className="mt-2 space-y-0.5">
            {spec.pros.map((p) => (
              <li key={p}>✅ {p}</li>
            ))}
            {spec.cons.map((c) => (
              <li key={c}>⚠️ {c}</li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["low", "learn", "good", "optimal", "high"] as const)
              .filter((t) => spec.zones.some((z) => z.tone === t))
              .map((t) => (
                <span key={t} className={cn("inline-flex items-center gap-1")}>
                  <span aria-hidden="true">{ZONE_META[t].icon}</span>
                  {ZONE_META[t].label}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
