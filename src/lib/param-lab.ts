import { useCallback, useMemo, useState } from "react";

export type ZoneTone = "low" | "learn" | "good" | "optimal" | "high";

export type Zone = { from: number; to: number; tone: ZoneTone };

export const ZONE_META: Record<
  ZoneTone,
  { label: string; icon: string; color: string; status: string; blurb: string; striped: boolean }
> = {
  low: {
    label: "Too Low",
    icon: "🔴",
    color: "oklch(0.63 0.23 25)",
    status: "Likely to fail",
    blurb: "Too small to produce the intended result.",
    striped: true,
  },
  learn: {
    label: "Learning Zone",
    icon: "🟡",
    color: "oklch(0.85 0.16 95)",
    status: "Needs improvement",
    blurb: "Safe to explore — the effect shows, but it is weak.",
    striped: false,
  },
  good: {
    label: "Good Range",
    icon: "🔵",
    color: "oklch(0.78 0.16 205)",
    status: "Good",
    blurb: "Produces strong, efficient results.",
    striped: false,
  },
  optimal: {
    label: "Optimal Range",
    icon: "🟢",
    color: "oklch(0.8 0.19 145)",
    status: "Excellent / optimal",
    blurb: "Recommended range for the objective you selected.",
    striped: false,
  },
  high: {
    label: "Too High",
    icon: "🟠",
    color: "oklch(0.7 0.2 45)",
    status: "Inefficient / extreme",
    blurb: "Wasteful, unstable or unrealistic in this model.",
    striped: true,
  },
};

export type ParamSpec = {
  key: string;
  label: string;
  icon: string;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  /** What the student SEES change in the simulation. */
  effect: { up: string; down: string };
  /** Age-appropriate scientific reason. */
  reason: string;
  pros: string[];
  cons: string[];
  /** Animated cause-and-effect chain, e.g. ["Gas pressure ↑","Magma pressure ↑","Bigger blast"] */
  chain: { up: string[]; down: string[] };
  /** Objective-dependent zones covering [min,max]. */
  zones: Zone[];
  /** Best single value to suggest for the current objective. */
  suggested: number;
};

export function zoneAt(zones: Zone[], value: number): Zone {
  const first = zones[0];
  if (!first) throw new Error("A parameter must define at least one zone");
  return zones.find(z => value >= z.from && value <= z.to)
    ?? (value < first.from ? first : zones[zones.length - 1] ?? first);
}

export function rangeText(zones: Zone[], tone: ZoneTone, unit?: string) {
  const zs = zones.filter((z) => z.tone === tone);
  if (!zs.length) return "—";
  const from = Math.min(...zs.map((z) => z.from));
  const to = Math.max(...zs.map((z) => z.to));
  const u = unit ? ` ${unit}` : "";
  return `${from}${u} – ${to}${u}`;
}

export function verdict(spec: ParamSpec, value: number) {
  const z = zoneAt(spec.zones, value);
  const meta = ZONE_META[z.tone];
  const optimal = rangeText(spec.zones, "optimal", spec.unit);
  const relation =
    z.tone === "optimal"
      ? "inside the recommended range"
      : value > (spec.zones.find((s) => s.tone === "optimal")?.to ?? spec.max)
        ? "above the recommended range"
        : "below the recommended range";
  return { zone: z, meta, optimal, relation };
}

export type ChangeEvent = {
  id: number;
  key: string;
  label: string;
  icon: string;
  unit?: string;
  from: number | string;
  to: number | string;
  direction: "up" | "down";
  time: string;
  effect: string;
  reason: string;
  chain: string[];
};

let counter = 0;

export function useParamLab() {
  const [history, setHistory] = useState<ChangeEvent[]>([]);
  const [replayId, setReplayId] = useState<number | null>(null);

  const record = useCallback((spec: ParamSpec, from: number, to: number) => {
    if (from === to) return;
    const direction: "up" | "down" = to > from ? "up" : "down";
    const ev: ChangeEvent = {
      id: ++counter,
      key: spec.key,
      label: spec.label,
      icon: spec.icon,
      ...(spec.unit ? { unit: spec.unit } : {}),
      from,
      to,
      direction,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      effect: spec.effect[direction],
      reason: spec.reason,
      chain: spec.chain[direction],
    };
    setHistory((h) => [ev, ...h].slice(0, 40));
  }, []);

  const recordChoice = useCallback(
    (opts: {
      key: string;
      label: string;
      icon: string;
      from: string;
      to: string;
      effect: string;
      reason: string;
      chain: string[];
    }) => {
      if (opts.from === opts.to) return;
      setHistory((h) =>
        [
          {
            id: ++counter,
            direction: "up" as const,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            ...opts,
          },
          ...h,
        ].slice(0, 40),
      );
    },
    [],
  );

  const last = history[0] ?? null;
  const selected = useMemo(
    () => history.find((h) => h.id === replayId) ?? null,
    [history, replayId],
  );

  return {
    history,
    last,
    record,
    recordChoice,
    replay: setReplayId,
    selected,
    clear: () => setHistory([]),
  };
}

export type MetricRow = { label: string; value: string; numeric?: number; better?: "up" | "down" };

export type Run = { name: string; params: { label: string; value: string }[]; metrics: MetricRow[] };

export function useRuns() {
  const [runs, setRuns] = useState<Run[]>([]);
  const save = useCallback((run: Omit<Run, "name">) => {
    setRuns((r) => {
      const next = [...r, { ...run, name: `Attempt ${r.length + 1}` }];
      return next.slice(-6);
    });
  }, []);
  return { runs, save, clear: () => setRuns([]) };
}

export type LabMode = "explore" | "guided" | "challenge";
