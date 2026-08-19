export type CamelotId =
  | "1A" | "2A" | "3A" | "4A" | "5A" | "6A"
  | "7A" | "8A" | "9A" | "10A" | "11A" | "12A"
  | "1B" | "2B" | "3B" | "4B" | "5B" | "6B"
  | "7B" | "8B" | "9B" | "10B" | "11B" | "12B";

export type CamelotEntry = {
  id: CamelotId;
  musical: string;
  /** Cool steel-to-ink tones for the wheel — data viz, not brand chrome. */
  color: string;
  hz: number;
};

const RING: { musical: string; hz: number }[] = [
  { musical: "Abm", hz: 207.65 },
  { musical: "Ebm", hz: 155.56 },
  { musical: "Bbm", hz: 233.08 },
  { musical: "Fm", hz: 174.61 },
  { musical: "Cm", hz: 130.81 },
  { musical: "Gm", hz: 196.0 },
  { musical: "Dm", hz: 146.83 },
  { musical: "Am", hz: 220.0 },
  { musical: "Em", hz: 164.81 },
  { musical: "Bm", hz: 246.94 },
  { musical: "F#m", hz: 185.0 },
  { musical: "Dbm", hz: 138.59 },
];

const MAJOR: { musical: string; hz: number }[] = [
  { musical: "B", hz: 246.94 },
  { musical: "F#", hz: 185.0 },
  { musical: "Db", hz: 277.18 },
  { musical: "Ab", hz: 207.65 },
  { musical: "Eb", hz: 155.56 },
  { musical: "Bb", hz: 233.08 },
  { musical: "F", hz: 174.61 },
  { musical: "C", hz: 261.63 },
  { musical: "G", hz: 196.0 },
  { musical: "D", hz: 293.66 },
  { musical: "A", hz: 220.0 },
  { musical: "E", hz: 329.63 },
];

const INNER = [
  "#9aa7b2", "#8ea3b5", "#829eb8", "#7898b4",
  "#6f91ad", "#6a889f", "#748a96", "#7d9198",
  "#88959a", "#8e9aa0", "#96a2a8", "#a0aab0",
];
const OUTER = [
  "#c5ccd2", "#b7c4ce", "#a8bbca", "#9ab3c4",
  "#8ba9bb", "#7e9cad", "#7a929e", "#84969e",
  "#8f9ca3", "#99a4aa", "#a4aeb4", "#b0b8bd",
];

export const CAMELOT: CamelotEntry[] = [
  ...RING.map((r, i) => ({
    id: `${i + 1}A` as CamelotId,
    musical: r.musical,
    color: INNER[i]!,
    hz: r.hz,
  })),
  ...MAJOR.map((r, i) => ({
    id: `${i + 1}B` as CamelotId,
    musical: r.musical,
    color: OUTER[i]!,
    hz: r.hz,
  })),
];

const BY_ID = new Map(CAMELOT.map((c) => [c.id, c]));

export function camelot(id: string): CamelotEntry | undefined {
  return BY_ID.get(id as CamelotId);
}

/** Harmonic mixing: same slot, ±1 around the wheel, or relative major/minor. */
export function compatibleKeys(id: string): Set<string> {
  const m = /^(\d+)([AB])$/.exec(id);
  if (!m) return new Set([id]);
  const n = Number(m[1]);
  const letter = m[2] as "A" | "B";
  const flip = letter === "A" ? "B" : "A";
  const prev = n === 1 ? 12 : n - 1;
  const next = n === 12 ? 1 : n + 1;
  return new Set([id, `${prev}${letter}`, `${next}${letter}`, `${n}${flip}`]);
}

export function energyDelta(from: number, to: number): number {
  return to - from;
}

export function bpmCompatible(a: number, b: number, window = 6): boolean {
  return Math.abs(a - b) <= window || Math.abs(a * 2 - b) <= window || Math.abs(a - b * 2) <= window;
}
