import { isMixablePair } from "./domain";
import type { Track } from "./types";

export function mixableFor(track: Track, all: Track[]): Track[] {
  return all
    .filter((t) => isMixablePair(track, t))
    .sort(
      (a, b) => Math.abs(a.bpm - track.bpm) - Math.abs(b.bpm - track.bpm) || b.energy - a.energy,
    );
}
