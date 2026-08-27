import { useState } from "react";
import { Panel } from "@/components/lab/Panel";
import { StatusBadge } from "@/components/lab/ZoneSlider";
import {
  ZONE_META,
  verdict,
  type ChangeEvent,
  type LabMode,
  type MetricRow,
  type ParamSpec,
  type Run,
} from "@/lib/param-lab";
import { cn } from "@/lib/utils";

/* ---------------- Cause & effect chain ---------------- */

export function CauseChain({ steps }: { steps: string[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span
            className="animate-fade-in rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs text-foreground"
            style={{ animationDelay: `${i * 140}ms` }}
          >
            {s}
          </span>
          {i < steps.length - 1 && (
            <span aria-hidden="true" className="text-primary animate-pulse-glow">
              →
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

/* ---------------- What changed panel ---------------- */

export function WhatChangedPanel({
  event,
  spec,
  currentValue,
  suggestionText,
}: {
  event: ChangeEvent | null;
  spec?: ParamSpec;
  currentValue?: number;
  suggestionText?: string;
}) {
  if (!event) {
    return (
      <Panel eyebrow="Parameter impact" title="What Changed?">
        <p className="text-sm text-muted-foreground">
          Move any slider or press a button. This panel will explain exactly what you changed, what
          happened in the simulation, why it happened, and how to improve it.
        </p>
      </Panel>
    );
  }

  const v = spec && currentValue !== undefined ? verdict(spec, currentValue) : null;

  return (
    <Panel
      eyebrow="Parameter impact"
      title="What Changed?"
      className="animate-scale-in"
      right={v ? <StatusBadge tone={v.zone.tone} /> : undefined}
    >
      <div className="space-y-3 text-sm">
        <div className="rounded-xl border border-border bg-secondary/30 p-3">
          <p className="font-display text-xs tracking-widest text-accent uppercase">
            Parameter changed
          </p>
          <p className="text-foreground">
            <span aria-hidden="true">{event.icon}</span> {event.label}:{" "}
            <span className="tabular-nums text-muted-foreground">
              {event.from}
              {event.unit ? ` ${event.unit}` : ""}
            </span>{" "}
            <span aria-hidden="true">→</span>{" "}
            <span className="tabular-nums text-primary">
              {event.to}
              {event.unit ? ` ${event.unit}` : ""}
            </span>{" "}
            <span aria-hidden="true">{event.direction === "up" ? "⬆️" : "⬇️"}</span>
          </p>
        </div>

        <Row k="Immediate effect" v={event.effect} />
        <div>
          <p className="font-display text-xs tracking-widest text-accent uppercase">
            Cause and effect
          </p>
          <div className="mt-2">
            <CauseChain steps={event.chain} />
          </div>
        </div>
        <Row k="Scientific reason" v={event.reason} />

        {spec && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-bio/40 bg-bio/5 p-3">
              <p className="font-display text-xs tracking-widest text-bio uppercase">Advantages</p>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                {spec.pros.map((p) => (
                  <li key={p}>✅ {p}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-magma/40 bg-magma/5 p-3">
              <p className="font-display text-xs tracking-widest text-magma uppercase">
                Possible problems
              </p>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                {spec.cons.map((c) => (
                  <li key={c}>⚠️ {c}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {v && spec && currentValue !== undefined && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <p className="text-[0.7rem] tracking-widest text-muted-foreground uppercase">
                Recommended range
              </p>
              <p className="font-display text-primary">⭐ {v.optimal}</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <p className="text-[0.7rem] tracking-widest text-muted-foreground uppercase">
                Your current setting
              </p>
              <p className="font-display" style={{ color: v.meta.color }}>
                {currentValue}
                {spec.unit ? ` ${spec.unit}` : ""} — {v.meta.icon} {v.meta.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {v.zone.tone === "optimal" ? "Inside the recommended range" : v.relation}
              </p>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-primary/40 bg-primary/10 p-3">
          <p className="font-display text-xs tracking-widest text-primary uppercase">
            Improvement suggestion
          </p>
          <p className="text-muted-foreground">
            {suggestionText ??
              (spec
                ? `Try setting ${spec.label} to about ${spec.suggested}${spec.unit ? ` ${spec.unit}` : ""} and compare the results.`
                : "Try another value and compare the results.")}
          </p>
        </div>
      </div>
    </Panel>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="font-display text-xs tracking-widest text-accent uppercase">{k}</p>
      <p className="text-muted-foreground">{v}</p>
    </div>
  );
}

/* ---------------- Why did this change? note ---------------- */

export function ScienceNote({
  title,
  body,
  tryThis,
}: {
  title: string;
  body: string;
  tryThis: string;
}) {
  return (
    <div className="animate-fade-in rounded-2xl border border-accent/40 bg-accent/10 p-4">
      <p className="font-display text-sm text-accent">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <p className="mt-2 text-sm text-foreground">
        <span aria-hidden="true">🧪</span> Try this: {tryThis}
      </p>
    </div>
  );
}

/* ---------------- Live graph ---------------- */

export type Point = { x: number; y: number };

export function LiveGraph({
  title,
  xLabel,
  yLabel,
  points,
  marker,
  color = "var(--primary)",
}: {
  title: string;
  xLabel: string;
  yLabel: string;
  points: Point[];
  marker?: Point;
  color?: string;
}) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(0, ...ys);
  const y1 = Math.max(...ys, y0 + 1);
  const sx = (x: number) => ((x - x0) / (x1 - x0 || 1)) * 260 + 30;
  const sy = (y: number) => 110 - ((y - y0) / (y1 - y0 || 1)) * 92;
  const d = points.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");

  return (
    <figure className="rounded-xl border border-border bg-secondary/25 p-3">
      <figcaption className="mb-1 text-xs text-muted-foreground">
        <span className="font-display text-foreground">{title}</span> · {yLabel} vs {xLabel}
      </figcaption>
      <svg viewBox="0 0 300 125" className="h-32 w-full" role="img" aria-label={`${title}: ${yLabel} against ${xLabel}`}>
        <line x1="30" y1="110" x2="290" y2="110" stroke="var(--border)" />
        <line x1="30" y1="14" x2="30" y2="110" stroke="var(--border)" />
        <path d={d} fill="none" stroke={color} strokeWidth="2.5" className="transition-all duration-300" />
        <path d={`${d} L${sx(x1)},110 L${sx(x0)},110 Z`} fill={color} opacity="0.12" />
        {marker && (
          <g className="animate-pulse-glow">
            <line x1={sx(marker.x)} y1="14" x2={sx(marker.x)} y2="110" stroke={color} strokeDasharray="3 3" opacity="0.7" />
            <circle cx={sx(marker.x)} cy={sy(marker.y)} r="5" fill={color} />
          </g>
        )}
        <text x="150" y="122" textAnchor="middle" fontSize="8" fill="var(--muted-foreground)">
          {xLabel}
        </text>
      </svg>
    </figure>
  );
}

/* ---------------- Timeline ---------------- */

export function ParameterTimeline({
  history,
  onReplay,
  activeId,
}: {
  history: ChangeEvent[];
  onReplay: (id: number) => void;
  activeId?: number | null;
}) {
  return (
    <Panel eyebrow="Parameter history" title="Experiment Timeline">
      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Every change you make is logged here with a timestamp. Click any moment to replay it.
        </p>
      ) : (
        <ol className="space-y-2">
          {history.slice(0, 10).map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => onReplay(h.id)}
                className={cn(
                  "w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                  activeId === h.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-secondary/50",
                )}
              >
                <span className="font-display text-xs text-primary tabular-nums">{h.time}</span>{" "}
                <span aria-hidden="true">{h.icon}</span> {h.label}{" "}
                <span className="text-muted-foreground tabular-nums">
                  {h.from} → {h.to}
                  {h.unit ? ` ${h.unit}` : ""}
                </span>
                <span className="block text-xs text-muted-foreground">{h.effect}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

/* ---------------- Compare runs ---------------- */

export function CompareRuns({
  current,
  runs,
  onSave,
  onClear,
  onApplyRun,
}: {
  current: Omit<Run, "name">;
  runs: Run[];
  onSave: () => void;
  onClear: () => void;
  onApplyRun?: (run: Run) => void;
}) {
  const a = runs[runs.length - 1];
  const rows = current.metrics.map((m, i) => ({
    label: m.label,
    b: m.value,
    a: a?.metrics[i]?.value ?? "—",
    delta:
      a && m.numeric !== undefined && a.metrics[i]?.numeric !== undefined
        ? m.numeric - (a.metrics[i].numeric as number)
        : undefined,
    better: m.better ?? "up",
  }));

  return (
    <Panel
      eyebrow="Before and after"
      title="Compare Results"
      right={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSave}
            className="rounded-full bg-primary px-3 py-1.5 font-display text-[0.65rem] tracking-widest text-primary-foreground uppercase"
          >
            Save this run
          </button>
          {runs.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-full border border-border px-3 py-1.5 font-display text-[0.65rem] tracking-widest uppercase"
            >
              Clear
            </button>
          )}
        </div>
      }
    >
      {!a ? (
        <p className="text-sm text-muted-foreground">
          Save a run, change your parameters, then come back to see a side-by-side comparison of
          what your change did.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Comparison between your saved run and current setup</caption>
            <thead>
              <tr className="text-left font-display text-[0.7rem] tracking-widest text-muted-foreground uppercase">
                <th className="py-1">Measurement</th>
                <th className="py-1">{a.name} (saved)</th>
                <th className="py-1">Now</th>
                <th className="py-1">Impact</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const improved =
                  r.delta === undefined
                    ? null
                    : r.better === "up"
                      ? r.delta > 0
                      : r.delta < 0;
                return (
                  <tr key={r.label} className="border-t border-border/60">
                    <td className="py-1.5 text-muted-foreground">{r.label}</td>
                    <td className="py-1.5 tabular-nums">{r.a}</td>
                    <td className="py-1.5 tabular-nums text-foreground">{r.b}</td>
                    <td className="py-1.5">
                      {r.delta === undefined || Math.abs(r.delta) < 0.001 ? (
                        <span className="text-muted-foreground">no change</span>
                      ) : (
                        <span className={improved ? "text-bio" : "text-magma"}>
                          {improved ? "▲ improved" : "▼ reduced"}{" "}
                          <span className="tabular-nums">
                            {r.delta > 0 ? "+" : ""}
                            {Math.round(r.delta * 100) / 100}
                          </span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <SplitCard title={`${a.name} (saved)`} items={a.params} />
            <SplitCard title="Current setup" items={current.params} highlight />
          </div>
          {onApplyRun && (
            <button
              type="button"
              onClick={() => onApplyRun(a)}
              className="mt-3 rounded-full border border-border px-3 py-1.5 font-display text-[0.65rem] tracking-widest uppercase"
            >
              Replay saved settings
            </button>
          )}
        </div>
      )}
    </Panel>
  );
}

function SplitCard({
  title,
  items,
  highlight,
}: {
  title: string;
  items: { label: string; value: string }[];
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3 text-sm",
        highlight ? "border-primary/50 bg-primary/5" : "border-border bg-secondary/25",
      )}
    >
      <p className="font-display text-xs tracking-widest text-muted-foreground uppercase">{title}</p>
      <dl className="mt-1 space-y-0.5">
        {items.map((i) => (
          <div key={i.label} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{i.label}</dt>
            <dd className="tabular-nums">{i.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ---------------- Mode switch ---------------- */

export function ModeSwitch({
  mode,
  onChange,
  challenge,
}: {
  mode: LabMode;
  onChange: (m: LabMode) => void;
  challenge: string;
}) {
  const modes: { key: LabMode; label: string; icon: string; blurb: string }[] = [
    { key: "explore", label: "Explore", icon: "🔭", blurb: "Change anything. The lab explains what happens, without pushing you to one answer." },
    { key: "guided", label: "Guided", icon: "🧭", blurb: "The science coach gives you hints as you go." },
    { key: "challenge", label: "Challenge", icon: "🎯", blurb: challenge },
  ];
  const active = modes.find((m) => m.key === mode)!;
  return (
    <Panel eyebrow="Simulation mode" title={`${active.icon} ${active.label} Mode`}>
      <div className="flex flex-wrap gap-2">
        {modes.map((m) => (
          <button
            key={m.key}
            type="button"
            aria-pressed={mode === m.key}
            onClick={() => onChange(m.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              mode === m.key
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:bg-secondary/60",
            )}
          >
            <span aria-hidden="true">{m.icon}</span> {m.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{active.blurb}</p>
    </Panel>
  );
}

/* ---------------- Coach ---------------- */

export function ScienceCoach({
  observation,
  why,
  suggestion,
  question,
  muted,
}: {
  observation: string;
  why: string;
  suggestion: string;
  question: string;
  muted?: boolean;
}) {
  return (
    <Panel
      eyebrow="Smart experiment coach"
      title="Coach Nova"
      className={cn("scanline", muted && "opacity-90")}
      right={<span className="text-2xl animate-float-slow" aria-hidden="true">🤖</span>}
    >
      <div className="space-y-2 text-sm">
        <p className="text-foreground">💡 {observation}</p>
        <p className="text-muted-foreground">
          <span className="font-display text-xs tracking-widest text-accent uppercase">Why? </span>
          {why}
        </p>
        <p className="text-muted-foreground">
          <span className="font-display text-xs tracking-widest text-primary uppercase">
            Suggestion:{" "}
          </span>
          {suggestion}
        </p>
        <p className="rounded-xl border border-border bg-secondary/30 p-3 text-foreground">
          🤔 {question}
        </p>
      </div>
    </Panel>
  );
}

/* ---------------- Prediction ---------------- */

export function PredictionCard({
  question,
  options,
  correct,
  explanation,
}: {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  return (
    <Panel eyebrow="Predict → experiment → explain" title="Make a Prediction">
      <p className="text-sm text-muted-foreground">{question}</p>
      <div className="mt-3 space-y-2">
        {options.map((o, i) => (
          <button
            key={o}
            type="button"
            aria-pressed={picked === i}
            onClick={() => {
              setPicked(i);
              setRevealed(false);
            }}
            className={cn(
              "block w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors",
              picked === i
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-secondary/50",
            )}
          >
            {o}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={picked === null}
        onClick={() => setRevealed(true)}
        className="mt-3 rounded-full bg-primary px-4 py-2 font-display text-xs tracking-widest text-primary-foreground uppercase disabled:opacity-50"
      >
        Check my prediction
      </button>
      {revealed && picked !== null && (
        <div className="mt-3 animate-fade-in space-y-1 rounded-xl border border-border bg-secondary/30 p-3 text-sm">
          <p>
            <span className="text-muted-foreground">Your prediction: </span>
            {options[picked]}
          </p>
          <p className={picked === correct ? "text-bio" : "text-magma"}>
            {picked === correct ? "Correct! 🎉" : "Not quite — but great thinking. 🔍"}
          </p>
          <p className="text-muted-foreground">
            <span className="font-display text-xs tracking-widest text-accent uppercase">Why? </span>
            {explanation}
          </p>
        </div>
      )}
    </Panel>
  );
}

/* ---------------- Scorecard ---------------- */

export function ResultScorecard({
  stars,
  rows,
  overall,
  didWell,
  improve,
  tryNext,
}: {
  stars: number;
  rows: MetricRow[];
  overall: string;
  didWell: string;
  improve: string;
  tryNext: string;
}) {
  return (
    <Panel
      eyebrow="Experiment result rating"
      title="Your Scorecard"
      right={
        <p className="text-lg" aria-label={`${stars} out of 5 stars`}>
          {"⭐".repeat(stars)}
          <span className="opacity-30">{"☆".repeat(5 - stars)}</span>
        </p>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="rounded-xl border border-border bg-secondary/30 px-3 py-2">
            <p className="text-[0.7rem] tracking-widest text-muted-foreground uppercase">{r.label}</p>
            <p className="font-display text-primary tabular-nums">{r.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 font-display text-accent">{overall}</p>
      <dl className="mt-2 space-y-2 text-sm">
        <div>
          <dt className="font-display text-xs tracking-widest text-bio uppercase">
            What you did well
          </dt>
          <dd className="text-muted-foreground">{didWell}</dd>
        </div>
        <div>
          <dt className="font-display text-xs tracking-widest text-magma uppercase">
            What could be improved
          </dt>
          <dd className="text-muted-foreground">{improve}</dd>
        </div>
        <div>
          <dt className="font-display text-xs tracking-widest text-primary uppercase">Try next</dt>
          <dd className="text-muted-foreground">{tryNext}</dd>
        </div>
      </dl>
    </Panel>
  );
}

/* ---------------- Best settings assistant ---------------- */

export function BestSettings({
  specs,
  values,
  onApplyAll,
  onApplyOne,
  expectedImprovement,
  why,
}: {
  specs: ParamSpec[];
  values: Record<string, number>;
  onApplyAll: () => void;
  onApplyOne: (key: string) => void;
  expectedImprovement: string;
  why: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Panel eyebrow="Optimization" title="Show Me How to Improve">
      {!open ? (
        <>
          <p className="text-sm text-muted-foreground">
            Ready for a hint? The lab will compare your setup with a configuration that suits your
            current objective — you can accept it, take one value at a time, or ignore it completely.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 rounded-full bg-accent px-4 py-2 font-display text-xs tracking-widest text-accent-foreground uppercase neon-ring"
          >
            Show me how to improve
          </button>
        </>
      ) : (
        <div className="space-y-3 text-sm">
          <table className="w-full">
            <thead>
              <tr className="text-left font-display text-[0.7rem] tracking-widest text-muted-foreground uppercase">
                <th className="py-1">Parameter</th>
                <th className="py-1">Yours</th>
                <th className="py-1">Suggested</th>
                <th className="py-1 sr-only">Apply</th>
              </tr>
            </thead>
            <tbody>
              {specs.map((s) => {
                const v = values[s.key];
                const same = v === s.suggested;
                const tone = ZONE_META[verdict(s, v).zone.tone];
                return (
                  <tr key={s.key} className="border-t border-border/60">
                    <td className="py-1.5 text-muted-foreground">
                      <span aria-hidden="true">{s.icon}</span> {s.label}
                    </td>
                    <td className="py-1.5 tabular-nums" style={{ color: tone.color }}>
                      {v}
                      {s.unit ? ` ${s.unit}` : ""} <span aria-hidden="true">{tone.icon}</span>
                    </td>
                    <td className="py-1.5 tabular-nums text-bio">
                      {s.suggested}
                      {s.unit ? ` ${s.unit}` : ""}
                    </td>
                    <td className="py-1.5 text-right">
                      {!same && (
                        <button
                          type="button"
                          onClick={() => onApplyOne(s.key)}
                          className="rounded-full border border-border px-2 py-0.5 text-xs"
                        >
                          Apply
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-muted-foreground">
            <span className="font-display text-xs tracking-widest text-bio uppercase">
              Expected improvement:{" "}
            </span>
            {expectedImprovement}
          </p>
          <p className="text-muted-foreground">
            <span className="font-display text-xs tracking-widest text-accent uppercase">Why? </span>
            {why}
          </p>
          <p className="text-xs text-muted-foreground">
            Remember: there is no single perfect value. The best setting depends on your objective,
            your conditions and the whole combination of variables — several setups can succeed.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onApplyAll}
              className="rounded-full bg-primary px-4 py-2 font-display text-xs tracking-widest text-primary-foreground uppercase"
            >
              Apply all suggested values
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-border px-4 py-2 font-display text-xs tracking-widest uppercase"
            >
              Try my own idea
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}
