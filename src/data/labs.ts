export type LabRoom = {
  slug: string;
  emoji: string;
  name: string;
  blurb: string;
  accent: string;
  experiments: { title: string; to?: string; note: string }[];
};

export const LAB_ROOMS: LabRoom[] = [
  {
    slug: "earth",
    emoji: "🌋",
    name: "Earth Science Lab",
    blurb: "Tectonics, magma chambers and eruption dynamics.",
    accent: "from-magma/30",
    experiments: [
      { title: "Volcano Eruption Simulator", to: "/experiments/volcano", note: "Live simulation" },
      { title: "Earthquake Wave Table", note: "Coming soon" },
    ],
  },
  {
    slug: "space",
    emoji: "🚀",
    name: "Space Lab",
    blurb: "Launch vehicles, orbits and escape velocity.",
    accent: "from-primary/30",
    experiments: [
      { title: "Rocket Launch Simulator", to: "/experiments/rocket", note: "Live simulation" },
      { title: "Solar System Builder", note: "Coming soon" },
    ],
  },
  {
    slug: "physics",
    emoji: "⚛",
    name: "Physics Lab",
    blurb: "Gravity, motion and energy across worlds.",
    accent: "from-accent/30",
    experiments: [
      { title: "Gravity Chamber", to: "/experiments/gravity", note: "Live simulation" },
      { title: "Pendulum Bench", note: "Coming soon" },
    ],
  },
  {
    slug: "energy",
    emoji: "⚡",
    name: "Energy Lab",
    blurb: "Renewables, generators and power output.",
    accent: "from-bio/30",
    experiments: [
      { title: "Wind Turbine Builder", to: "/experiments/turbine", note: "Live simulation" },
      { title: "Circuit Workbench", note: "Coming soon" },
    ],
  },
  {
    slug: "biology",
    emoji: "🧬",
    name: "Biology Lab",
    blurb: "DNA, inheritance and living systems.",
    accent: "from-bio/30",
    experiments: [{ title: "DNA Mixing Simulator", note: "Coming soon" }],
  },
  {
    slug: "chemistry",
    emoji: "🧪",
    name: "Chemistry Lab",
    blurb: "Safe virtual reactions with full lab rules.",
    accent: "from-accent/30",
    experiments: [{ title: "Chemical Reaction Lab", note: "Coming soon" }],
  },
  {
    slug: "human-body",
    emoji: "🧠",
    name: "Human Body Lab",
    blurb: "Immune defence, recovery and body systems.",
    accent: "from-primary/30",
    experiments: [{ title: "Immune System Simulator", note: "Coming soon" }],
  },
  {
    slug: "environment",
    emoji: "🌍",
    name: "Environment Lab",
    blurb: "Ecosystems, climate and balance over time.",
    accent: "from-bio/30",
    experiments: [{ title: "Ecosystem Simulator", note: "Coming soon" }],
  },
  {
    slug: "ocean",
    emoji: "🌊",
    name: "Ocean Lab",
    blurb: "Currents, pressure and marine life.",
    accent: "from-primary/30",
    experiments: [{ title: "Deep Dive Pressure Rig", note: "Coming soon" }],
  },
  {
    slug: "engineering",
    emoji: "🏗",
    name: "Engineering Lab",
    blurb: "Structures, forces and clever machines.",
    accent: "from-magma/30",
    experiments: [{ title: "Bridge Load Tester", note: "Coming soon" }],
  },
];
