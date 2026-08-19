import { camelot } from "./camelot";
import { buildWaveform, seedFromSlug } from "./waveform";
import type { CuePoint, Track } from "./types";

export type CatalogAlbum = {
  slug: string;
  title: string;
  artist: string;
  genre: string;
  label: string;
  year: number;
  tracks: {
    title: string;
    bpm: number;
    key: string;
    energy: number;
    rating: number;
    duration: number;
    remixer?: string;
    tags?: string[];
    comment?: string;
  }[];
};

export const CATALOG_ALBUMS: CatalogAlbum[] = [
  {
    slug: "night-market",
    title: "Night Market",
    artist: "Mira Voss",
    genre: "Afro House",
    label: "Eastline",
    year: 2024,
    tracks: [
      { title: "Lanterns After Rain", bpm: 122, key: "8A", energy: 6, rating: 5, duration: 421, tags: ["vocal", "peak"] },
      { title: "Second Sitting", bpm: 120, key: "9A", energy: 5, rating: 4, duration: 388, tags: ["warmup"] },
      { title: "Steam Between Stalls", bpm: 123, key: "8B", energy: 7, rating: 5, duration: 456, tags: ["vocal"] },
      { title: "Copper Bowl", bpm: 118, key: "7A", energy: 4, rating: 3, duration: 364, tags: ["downtempo"] },
      { title: "Closing Bell", bpm: 124, key: "9B", energy: 8, rating: 5, duration: 402, tags: ["peak"] },
      { title: "Wet Asphalt", bpm: 121, key: "10A", energy: 6, rating: 4, duration: 439, tags: ["percussion"] },
    ],
  },
  {
    slug: "glass-rooms",
    title: "Glass Rooms",
    artist: "Northline",
    genre: "Melodic Techno",
    label: "Arcad",
    year: 2025,
    tracks: [
      { title: "Pavilion", bpm: 126, key: "4A", energy: 6, rating: 5, duration: 478, tags: ["hypnotic"] },
      { title: "Blue Hour Column", bpm: 128, key: "5A", energy: 7, rating: 5, duration: 512, tags: ["peak"] },
      { title: "Fog Line", bpm: 124, key: "4B", energy: 5, rating: 4, duration: 445, tags: ["warmup"] },
      { title: "Interior Light", bpm: 127, key: "3A", energy: 6, rating: 4, duration: 491, tags: ["hypnotic"] },
      { title: "Reflection Study", bpm: 125, key: "5B", energy: 5, rating: 3, duration: 407, tags: ["break"] },
      { title: "Last Visitor", bpm: 129, key: "6A", energy: 8, rating: 5, duration: 533, tags: ["peak"] },
    ],
  },
  {
    slug: "voltage",
    title: "Voltage",
    artist: "Sable Unit",
    genre: "Drum & Bass",
    label: "Gridlock",
    year: 2023,
    tracks: [
      { title: "Busbar", bpm: 174, key: "1A", energy: 9, rating: 5, duration: 345, tags: ["peak", "roller"] },
      { title: "Arc Length", bpm: 172, key: "12A", energy: 8, rating: 4, duration: 318, tags: ["roller"] },
      { title: "Copper Jump", bpm: 175, key: "1B", energy: 10, rating: 5, duration: 296, tags: ["peak"] },
      { title: "Hold Current", bpm: 170, key: "2A", energy: 7, rating: 4, duration: 367, tags: ["liquid"] },
      { title: "Night Feed", bpm: 174, key: "12B", energy: 8, rating: 5, duration: 331, tags: ["liquid"] },
      { title: "Fault Path", bpm: 176, key: "11A", energy: 9, rating: 4, duration: 284, tags: ["peak"] },
    ],
  },
  {
    slug: "afterhours",
    title: "Afterhours",
    artist: "The Late Fold",
    genre: "Deep House",
    label: "Low Room",
    year: 2022,
    tracks: [
      { title: "Scuffed Floor", bpm: 118, key: "6A", energy: 4, rating: 5, duration: 412, tags: ["warmup"] },
      { title: "One Spotlight", bpm: 120, key: "7A", energy: 5, rating: 4, duration: 398, tags: ["vocal"] },
      { title: "Booth Silhouette", bpm: 122, key: "6B", energy: 6, rating: 5, duration: 441, tags: ["groove"] },
      { title: "Haze Hold", bpm: 116, key: "5A", energy: 3, rating: 3, duration: 455, tags: ["downtempo", "warmup"] },
      { title: "Last Call Keys", bpm: 119, key: "8A", energy: 5, rating: 4, duration: 387, tags: ["vocal"] },
      { title: "Empty Room", bpm: 121, key: "7B", energy: 4, rating: 4, duration: 429, tags: ["groove"] },
    ],
  },
  {
    slug: "signal-path",
    title: "Signal Path",
    artist: "Ada Reed",
    genre: "Progressive",
    label: "Patchbay",
    year: 2025,
    tracks: [
      { title: "Patch 14", bpm: 124, key: "9A", energy: 6, rating: 5, duration: 502, tags: ["hypnotic"] },
      { title: "Tungsten Sweep", bpm: 126, key: "10A", energy: 7, rating: 5, duration: 548, tags: ["peak"] },
      { title: "Dust on the Panel", bpm: 122, key: "9B", energy: 5, rating: 4, duration: 476, tags: ["warmup"] },
      { title: "Clock In", bpm: 125, key: "8A", energy: 6, rating: 4, duration: 519, tags: ["hypnotic"] },
      { title: "Return Send", bpm: 127, key: "11A", energy: 8, rating: 5, duration: 487, tags: ["peak"] },
      { title: "Cable Map", bpm: 123, key: "10B", energy: 5, rating: 3, duration: 461, tags: ["break"] },
    ],
  },
  {
    slug: "dust-circuit",
    title: "Dust Circuit",
    artist: "Nyx Radio",
    genre: "Breaks",
    label: "Beacon",
    year: 2024,
    tracks: [
      { title: "Red Beacon", bpm: 132, key: "3A", energy: 7, rating: 5, duration: 356, tags: ["peak"] },
      { title: "Desert Feed", bpm: 130, key: "2A", energy: 6, rating: 4, duration: 372, tags: ["groove"] },
      { title: "Tower Shadow", bpm: 134, key: "3B", energy: 8, rating: 5, duration: 341, tags: ["peak"] },
      { title: "Star Grid", bpm: 128, key: "4A", energy: 5, rating: 4, duration: 399, tags: ["warmup"] },
      { title: "Dust Return", bpm: 131, key: "2B", energy: 6, rating: 3, duration: 328, tags: ["percussion"] },
      { title: "Night Watch", bpm: 133, key: "1A", energy: 7, rating: 4, duration: 364, tags: ["groove"] },
    ],
  },
  {
    slug: "low-orbit",
    title: "Low Orbit",
    artist: "Iori",
    genre: "Downtempo",
    label: "Terminus",
    year: 2021,
    tracks: [
      { title: "Terminator", bpm: 92, key: "11A", energy: 2, rating: 5, duration: 378, tags: ["downtempo"] },
      { title: "Thin Blue", bpm: 96, key: "12A", energy: 3, rating: 4, duration: 401, tags: ["warmup", "downtempo"] },
      { title: "Window Seat", bpm: 88, key: "11B", energy: 2, rating: 5, duration: 355, tags: ["downtempo"] },
      { title: "Decay Path", bpm: 100, key: "10A", energy: 4, rating: 3, duration: 422, tags: ["break"] },
      { title: "Reentry", bpm: 108, key: "12B", energy: 5, rating: 4, duration: 339, tags: ["warmup"] },
      { title: "Ground Station", bpm: 94, key: "9A", energy: 2, rating: 4, duration: 416, tags: ["downtempo"] },
    ],
  },
  {
    slug: "peak-formula",
    title: "Peak Formula",
    artist: "Kett",
    genre: "Peak Techno",
    label: "Formula",
    year: 2025,
    tracks: [
      { title: "Strobe Index", bpm: 138, key: "5A", energy: 10, rating: 5, duration: 378, tags: ["peak"] },
      { title: "Warehouse Math", bpm: 140, key: "6A", energy: 9, rating: 5, duration: 401, tags: ["peak"] },
      { title: "Ceiling Grid", bpm: 136, key: "5B", energy: 8, rating: 4, duration: 356, tags: ["hypnotic"] },
      { title: "Crowd Pressure", bpm: 142, key: "7A", energy: 10, rating: 5, duration: 329, tags: ["peak"] },
      { title: "Haze Equation", bpm: 137, key: "4A", energy: 8, rating: 4, duration: 388, tags: ["hypnotic"] },
      { title: "Last Sixteen", bpm: 141, key: "6B", energy: 9, rating: 5, duration: 344, tags: ["peak"] },
    ],
  },
];

const CUE_COLORS = ["#c4c9ce", "#8fa3b0", "#d7dbe0", "#6f8290", "#b7c0c6", "#9aa7b0", "#dee2e6", "#7d8d96"];

function makeCues(bpm: number, duration: number): CuePoint[] {
  const bar = (60 / bpm) * 4;
  const intro = 0.12;
  const drop1 = Math.min(duration * 0.28, bar * 32);
  const break1 = Math.min(duration * 0.52, bar * 64);
  const drop2 = Math.min(duration * 0.68, bar * 80);
  const outro = Math.max(duration - bar * 16, duration * 0.86);
  const pts = [
    { position: 0, name: "Intro", startTime: intro, type: "1" as const },
    { position: 1, name: "Drop", startTime: drop1, type: "1" as const },
    { position: 2, name: "Break", startTime: break1, type: "1" as const },
    { position: 3, name: "Drop 2", startTime: drop2, type: "1" as const },
    { position: 4, name: "Outro", startTime: outro, type: "1" as const },
    { position: 5, name: "Loop 8", startTime: drop1, type: "5" as const, endTime: drop1 + bar * 8 },
  ];
  return pts.map((p) => ({
    ...p,
    endTime: "endTime" in p ? (p.endTime ?? null) : null,
    color: CUE_COLORS[p.position] ?? CUE_COLORS[0]!,
  }));
}

export type CatalogTrackSeed = Omit<Track, "id" | "userId">;

export function catalogTracks(): CatalogTrackSeed[] {
  const out: CatalogTrackSeed[] = [];
  for (const album of CATALOG_ALBUMS) {
    for (const t of album.tracks) {
      const slug = `${album.slug}-${t.title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const seed = seedFromSlug(slug);
      const key = camelot(t.key);
      out.push({
        title: t.title,
        artist: album.artist,
        album: album.title,
        albumSlug: album.slug,
        genre: album.genre,
        label: album.label,
        remixer: t.remixer ?? "",
        bpm: t.bpm,
        camelot: t.key,
        musicalKey: key?.musical ?? t.key,
        energy: t.energy,
        danceability: Math.min(10, t.energy + (t.tags?.includes("groove") ? 1 : 0)),
        rating: t.rating,
        duration: t.duration,
        year: album.year,
        playCount: Math.floor(seed % 40),
        comment: t.comment ?? "",
        color: key?.color ?? "#8fa3b0",
        archived: false,
        incoming: t.tags?.includes("incoming") ?? false,
        seed,
        waveform: buildWaveform(seed),
        cuepoints: makeCues(t.bpm, t.duration),
        tags: t.tags ?? [],
      });
    }
  }
  return out;
}

export type PlaylistSeed = {
  name: string;
  type: "folder" | "playlist" | "smartlist";
  parent: string | null;
  smartlist?: { field: string; op: string; value: string | number | string[] }[];
  match?: (t: CatalogTrackSeed) => boolean;
};

export const PLAYLIST_SEEDS: PlaylistSeed[] = [
  { name: "Sets", type: "folder", parent: null },
  { name: "Closing Peak", type: "playlist", parent: "Sets", match: (t) => t.energy >= 8 && t.rating >= 4 },
  { name: "Warmup", type: "playlist", parent: "Sets", match: (t) => (t.tags.includes("warmup") || t.energy <= 5) && t.bpm < 130 },
  { name: "Warehouse", type: "playlist", parent: "Sets", match: (t) => t.genre.includes("Techno") || t.genre === "Breaks" },
  { name: "Genres", type: "folder", parent: null },
  { name: "Afro House", type: "playlist", parent: "Genres", match: (t) => t.genre === "Afro House" },
  { name: "Melodic Techno", type: "playlist", parent: "Genres", match: (t) => t.genre === "Melodic Techno" },
  { name: "Drum & Bass", type: "playlist", parent: "Genres", match: (t) => t.genre === "Drum & Bass" },
  { name: "House", type: "playlist", parent: "Genres", match: (t) => t.genre.includes("House") },
  { name: "Smartlists", type: "folder", parent: null },
  {
    name: "Energy 8+",
    type: "smartlist",
    parent: "Smartlists",
    smartlist: [{ field: "energy", op: "gte", value: 8 }],
  },
  {
    name: "Five star",
    type: "smartlist",
    parent: "Smartlists",
    smartlist: [{ field: "rating", op: "gte", value: 5 }],
  },
  {
    name: "Mixable in 8A",
    type: "smartlist",
    parent: "Smartlists",
    smartlist: [{ field: "camelot", op: "in", value: ["8A", "7A", "9A", "8B"] }],
  },
];
