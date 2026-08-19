import { compatibleKeys } from "./camelot";
import type { CuePoint, Playlist, SmartRule, Track } from "./types";

export const MIX_BPM_WINDOW = 8;

export const SMART_FIELDS = ["genre", "energy", "rating", "camelot", "bpm", "year", "tag"] as const;
export const SMART_OPS = ["eq", "gte", "lte", "contains", "in"] as const;

export class DomainError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}

export function isCamelotId(id: string): boolean {
  return /^(1[0-2]|[1-9])[AB]$/.test(id);
}

export function assertCanonicalEnergy(value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > 10) {
    throw new DomainError("energy", "energy must be an integer 0–10");
  }
}

export function assertCanonicalDanceability(value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > 10) {
    throw new DomainError("danceability", "danceability must be an integer 0–10");
  }
}

export function assertCanonicalRating(value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > 5) {
    throw new DomainError("rating", "rating must be an integer 0–5");
  }
}

export function assertCamelot(id: string): void {
  if (!isCamelotId(id)) {
    throw new DomainError("camelot", `invalid Camelot id: ${id}`);
  }
}

export function assertOwned(actorId: string, rowUserId: string): void {
  if (actorId === "demo") {
    throw new DomainError("ownership", "demo is a shared seed, not a tenancy proof");
  }
  if (actorId !== rowUserId) {
    throw new DomainError("ownership", "crate does not belong to actor");
  }
}

export function assertParentFolder(parent: Playlist | null): void {
  if (parent && parent.type !== "folder") {
    throw new DomainError("playlist.parent", "parent must be a folder in the same crate");
  }
}

export function assertSameCrate(parent: Playlist, childUserId: string): void {
  if (parent.userId !== childUserId) {
    throw new DomainError("playlist.parent", "parent must belong to the same crate");
  }
}

export function validateCuepoints(cues: CuePoint[], duration: number): void {
  const seen = new Set<number>();
  for (const cue of cues) {
    if (!Number.isInteger(cue.position) || cue.position < 0 || cue.position > 7) {
      throw new DomainError("cue.position", "cue position must be integer 0–7");
    }
    if (seen.has(cue.position)) {
      throw new DomainError("cue.position", `duplicate cue slot ${cue.position}`);
    }
    seen.add(cue.position);
    if (!cue.name.trim()) {
      throw new DomainError("cue.name", "cue name must be non-empty");
    }
    if (cue.type !== "1" && cue.type !== "5") {
      throw new DomainError("cue.type", "cue type must be 1 or 5");
    }
    if (!(cue.startTime >= 0 && cue.startTime < duration)) {
      throw new DomainError("cue.startTime", "cue startTime must be in [0, duration)");
    }
    if (cue.type === "1" && cue.endTime !== null) {
      throw new DomainError("cue.endTime", "hotcues must have null endTime");
    }
    if (cue.type === "5" && !(typeof cue.endTime === "number" && cue.endTime > cue.startTime)) {
      throw new DomainError("cue.endTime", "loops require endTime > startTime");
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(cue.color)) {
      throw new DomainError("cue.color", "cue color must be #rrggbb");
    }
  }
}

export function matchSmart(track: Track, rules: SmartRule[]): boolean {
  return rules.every((rule) => evaluateSmartRule(track, rule));
}

export function evaluateSmartRule(track: Track, rule: SmartRule): boolean {
  if (!SMART_FIELDS.includes(rule.field)) {
    throw new DomainError("smartlist.field", `unknown smartlist field: ${String(rule.field)}`);
  }
  if (!SMART_OPS.includes(rule.op)) {
    throw new DomainError("smartlist.op", `unknown smartlist operator: ${String(rule.op)}`);
  }

  if (rule.field === "energy" || rule.field === "rating" || rule.field === "bpm" || rule.field === "year") {
    if (typeof rule.value !== "number" || Number.isNaN(rule.value)) {
      throw new DomainError("smartlist.value", `${rule.field} operand must be a number`);
    }
    const n = track[rule.field];
    if (rule.op === "gte") return n >= rule.value;
    if (rule.op === "lte") return n <= rule.value;
    if (rule.op === "eq") return n === rule.value;
    throw new DomainError("smartlist.op", `${rule.op} is not valid for ${rule.field}`);
  }

  if (rule.field === "genre") {
    if (typeof rule.value !== "string") {
      throw new DomainError("smartlist.value", "genre operand must be a string");
    }
    const s = rule.value.toLowerCase();
    if (rule.op === "contains") return track.genre.toLowerCase().includes(s);
    if (rule.op === "eq") return track.genre.toLowerCase() === s;
    throw new DomainError("smartlist.op", `${rule.op} is not valid for genre`);
  }

  if (rule.field === "camelot") {
    if (rule.op === "in") {
      if (!Array.isArray(rule.value) || rule.value.some((v) => typeof v !== "string")) {
        throw new DomainError("smartlist.value", "camelot in-operand must be string[]");
      }
      return rule.value.includes(track.camelot);
    }
    if (rule.op === "eq") {
      if (typeof rule.value !== "string") {
        throw new DomainError("smartlist.value", "camelot eq-operand must be a string");
      }
      return track.camelot === rule.value;
    }
    throw new DomainError("smartlist.op", `${rule.op} is not valid for camelot`);
  }

  if (rule.field === "tag") {
    if (typeof rule.value !== "string") {
      throw new DomainError("smartlist.value", "tag operand must be a string");
    }
    if (rule.op !== "eq" && rule.op !== "contains") {
      throw new DomainError("smartlist.op", `${rule.op} is not valid for tag`);
    }
    return track.tags.includes(rule.value);
  }

  throw new DomainError("smartlist.field", `unhandled smartlist field: ${rule.field}`);
}

/** Mix membership only. Sort order is presentation. */
export function isMixablePair(a: Track, b: Track): boolean {
  if (a.id === b.id) return false;
  return compatibleKeys(a.camelot).has(b.camelot) && Math.abs(a.bpm - b.bpm) <= MIX_BPM_WINDOW;
}
