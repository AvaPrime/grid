import { hashString, mulberry32 } from "./utils";

/** Deterministic waveform peaks (0–1) from a track seed. */
export function buildWaveform(seed: number, bars = 256): number[] {
  const rand = mulberry32(seed || 1);
  const out: number[] = [];
  let env = 0.15;
  for (let i = 0; i < bars; i++) {
    const t = i / bars;
    // Phrase envelope: intro, two drops, outro
    const intro = t < 0.08 ? t / 0.08 : 1;
    const outro = t > 0.88 ? (1 - t) / 0.12 : 1;
    const dropA = t > 0.22 && t < 0.48 ? 1 : 0.72;
    const dropB = t > 0.58 && t < 0.82 ? 1 : 0.7;
    const phrase = Math.max(dropA, dropB);
    env = env * 0.82 + (0.35 + rand() * 0.65) * 0.18;
    const kick = Math.abs(Math.sin(i * 0.55 + seed)) * 0.35;
    const peak = Math.min(1, env * phrase * intro * outro + kick * 0.25);
    out.push(Number(peak.toFixed(3)));
  }
  return out;
}

export function seedFromSlug(slug: string): number {
  return (hashString(slug) % 2147483647) || 1;
}
