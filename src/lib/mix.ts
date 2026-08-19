import { compatibleKeys } from "./camelot";
import type { Track } from "./types";

export function mixableFor(track: Track, all: Track[]): Track[] {
  const keys = compatibleKeys(track.camelot);
  return all
    .filter((t) => t.id !== track.id && keys.has(t.camelot) && Math.abs(t.bpm - track.bpm) <= 8)
    .sort((a, b) => Math.abs(a.bpm - track.bpm) - Math.abs(b.bpm - track.bpm) || b.energy - a.energy);
}
