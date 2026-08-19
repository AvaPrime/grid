import type { CuePoint, Playlist, SmartRule } from "./types";

export type ApiTrack = {
  id: number;
  title: string;
  artist: string;
  albumTitle: string;
  genre: string;
  label: string;
  remixer: string;
  bpm: number;
  key: string;
  energy: number;
  rating: number;
  duration: number;
  year: number;
  playCount: number;
  comment: unknown;
  color: unknown;
  archived: 0 | 1;
  cuepoints: CuePoint[];
  tags: string[];
};

export type ApiPlaylist = {
  id: number;
  name: string;
  parentId: number | null;
  type: "1" | "2" | "3";
  position: number;
  trackIds: number[];
  smartlist: SmartRule[] | null;
};

function parse<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== "string") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function toApiTrack(row: Record<string, unknown>): ApiTrack {
  return {
    id: Number(row.id),
    title: String(row.title),
    artist: String(row.artist),
    albumTitle: String(row.album ?? ""),
    genre: String(row.genre ?? ""),
    label: String(row.label ?? ""),
    remixer: String(row.remixer ?? ""),
    bpm: Number(row.bpm),
    key: String(row.camelot),
    energy: Number(row.energy),
    rating: Number(row.rating),
    duration: Number(row.duration),
    year: Number(row.year),
    playCount: Number(row.play_count ?? 0),
    comment: row.comment,
    color: row.color,
    archived: row.archived ? 1 : 0,
    cuepoints: parse(row.cuepoints_json, [] as CuePoint[]),
    tags: parse(row.tags_json, [] as string[]),
  };
}

export function toApiPlaylistType(type: string): "1" | "2" | "3" {
  if (type === "folder") return "1";
  if (type === "smartlist") return "3";
  return "2";
}

export function toApiPlaylist(playlist: Playlist): ApiPlaylist {
  return {
    id: playlist.id,
    name: playlist.name,
    parentId: playlist.parentId,
    type: toApiPlaylistType(playlist.type),
    position: playlist.position,
    trackIds: playlist.trackIds,
    smartlist: playlist.smartlist,
  };
}
