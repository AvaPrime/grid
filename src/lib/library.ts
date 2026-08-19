import { createServerFn } from "@tanstack/react-start";
import { getSql, type Sql } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/verify.server";
import { CATALOG_ALBUMS, PLAYLIST_SEEDS, catalogTracks } from "@/lib/catalog";
import { buildWaveform } from "@/lib/waveform";
import type { CuePoint, Playlist, SmartRule, Track } from "@/lib/types";

export const DEMO_USER = "demo";

type TrackRow = {
  id: number;
  user_id: string;
  title: string;
  artist: string;
  album: string;
  album_slug: string;
  genre: string;
  label: string;
  remixer: string;
  bpm: number;
  camelot: string;
  musical_key: string;
  energy: number;
  danceability: number;
  rating: number;
  duration: number;
  year: number;
  play_count: number;
  comment: string;
  color: string;
  archived: boolean;
  incoming: boolean;
  seed: number;
  waveform_json: string;
  cuepoints_json: string;
  tags_json: string;
};

type PlaylistRow = {
  id: number;
  user_id: string;
  name: string;
  parent_id: number | null;
  type: "folder" | "playlist" | "smartlist";
  position: number;
  smartlist_json: string | null;
};

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function mapTrack(row: TrackRow): Track {
  return {
    id: Number(row.id),
    userId: row.user_id,
    title: row.title,
    artist: row.artist,
    album: row.album,
    albumSlug: row.album_slug,
    genre: row.genre,
    label: row.label,
    remixer: row.remixer,
    bpm: Number(row.bpm),
    camelot: row.camelot,
    musicalKey: row.musical_key,
    energy: Number(row.energy),
    danceability: Number(row.danceability),
    rating: Number(row.rating),
    duration: Number(row.duration),
    year: Number(row.year),
    playCount: Number(row.play_count),
    comment: row.comment,
    color: row.color,
    archived: Boolean(row.archived),
    incoming: Boolean(row.incoming),
    seed: Number(row.seed),
    waveform: parseJson<number[]>(row.waveform_json, []),
    cuepoints: parseJson<CuePoint[]>(row.cuepoints_json, []),
    tags: parseJson<string[]>(row.tags_json, []),
  };
}

async function ownerId(): Promise<string> {
  const user = await getSessionUser();
  return user?.id ?? DEMO_USER;
}

const globalRef = globalThis as typeof globalThis & {
  __gridSeedChain__?: Map<string, Promise<void>>;
};

function seedChain() {
  if (!globalRef.__gridSeedChain__) globalRef.__gridSeedChain__ = new Map();
  return globalRef.__gridSeedChain__;
}

async function seedUser(sql: Sql, userId: string) {
  const tracks = catalogTracks();
  const idBySlug = new Map<string, number>();

  for (const t of tracks) {
    const slug = `${t.albumSlug}-${t.title}`;
    const rows = await sql<{ id: number }>`
      insert into tracks (
        user_id, title, artist, album, album_slug, genre, label, remixer,
        bpm, camelot, musical_key, energy, danceability, rating, duration,
        year, play_count, comment, color, archived, incoming, seed,
        waveform_json, cuepoints_json, tags_json
      ) values (
        ${userId}, ${t.title}, ${t.artist}, ${t.album}, ${t.albumSlug}, ${t.genre},
        ${t.label}, ${t.remixer}, ${t.bpm}, ${t.camelot}, ${t.musicalKey},
        ${t.energy}, ${t.danceability}, ${t.rating}, ${t.duration}, ${t.year},
        ${t.playCount}, ${t.comment}, ${t.color}, ${t.archived}, ${t.incoming},
        ${t.seed}, ${JSON.stringify(t.waveform)}, ${JSON.stringify(t.cuepoints)},
        ${JSON.stringify(t.tags)}
      ) returning id
    `;
    idBySlug.set(slug, Number(rows[0]?.id));
  }

  const seededTracks = tracks.map((t) => ({
    ...t,
    id: idBySlug.get(`${t.albumSlug}-${t.title}`) ?? 0,
  }));

  const folderIds = new Map<string, number>();
  let pos = 0;
  for (const p of PLAYLIST_SEEDS) {
    const parentId = p.parent ? (folderIds.get(p.parent) ?? null) : null;
    const rows = await sql<{ id: number }>`
      insert into playlists (user_id, name, parent_id, type, position, smartlist_json)
      values (
        ${userId}, ${p.name}, ${parentId}, ${p.type}, ${pos},
        ${p.smartlist ? JSON.stringify(p.smartlist) : null}
      ) returning id
    `;
    const id = Number(rows[0]?.id);
    if (p.type === "folder") folderIds.set(p.name, id);
    if (p.type === "playlist" && p.match) {
      const matches = seededTracks.filter(p.match);
      let i = 0;
      for (const t of matches) {
        await sql`
          insert into playlist_tracks (playlist_id, track_id, position)
          values (${id}, ${t.id}, ${i})
        `;
        i += 1;
      }
    }
    pos += 1;
  }
}

export async function ensureLibrary(sql: Sql, userId: string) {
  const chain = seedChain();
  const existing = chain.get(userId);
  if (existing) {
    await existing;
    return;
  }
  const run = (async () => {
    const expected = catalogTracks().length;
    const count = await sql<{ n: number }>`
      select count(*)::int as n from tracks where user_id = ${userId}
    `;
    const n = Number(count[0]?.n);
    if (n === expected) return;
    if (n > 0 && userId !== DEMO_USER) return;
    if (n > 0) {
      await sql`delete from playlist_tracks where playlist_id in (select id from playlists where user_id = ${userId})`;
      await sql`delete from playlists where user_id = ${userId}`;
      await sql`delete from tracks where user_id = ${userId}`;
    }
    try {
      await seedUser(sql, userId);
    } catch (err) {
      await sql`delete from playlist_tracks where playlist_id in (select id from playlists where user_id = ${userId})`;
      await sql`delete from playlists where user_id = ${userId}`;
      await sql`delete from tracks where user_id = ${userId}`;
      throw err;
    }
  })();
  chain.set(userId, run);
  try {
    await run;
  } finally {
    chain.delete(userId);
  }
}

async function loadPlaylists(sql: Sql, userId: string, tracks: Track[]): Promise<Playlist[]> {
  const rows = await sql<PlaylistRow>`
    select id, user_id, name, parent_id, type, position, smartlist_json
    from playlists where user_id = ${userId} order by position, id
  `;
  const links = await sql<{ playlist_id: number; track_id: number; position: number }>`
    select pt.playlist_id, pt.track_id, pt.position
    from playlist_tracks pt
    join playlists p on p.id = pt.playlist_id
    where p.user_id = ${userId}
    order by pt.position, pt.track_id
  `;
  const byPl = new Map<number, number[]>();
  for (const l of links) {
    const arr = byPl.get(Number(l.playlist_id)) ?? [];
    arr.push(Number(l.track_id));
    byPl.set(Number(l.playlist_id), arr);
  }
  return rows.map((r) => {
    const smartlist = parseJson<SmartRule[] | null>(r.smartlist_json, null);
    const trackIds =
      r.type === "smartlist" && smartlist
        ? tracks.filter((t) => matchSmart(t, smartlist)).map((t) => t.id)
        : (byPl.get(Number(r.id)) ?? []);
    return {
      id: Number(r.id),
      userId: r.user_id,
      name: r.name,
      parentId: r.parent_id === null ? null : Number(r.parent_id),
      type: r.type,
      position: Number(r.position),
      smartlist,
      trackIds,
    };
  });
}

function matchSmart(t: Track, rules: SmartRule[]): boolean {
  return rules.every((rule) => {
    const field = rule.field;
    const op = rule.op;
    const value = rule.value;
    if (field === "energy" || field === "rating" || field === "bpm" || field === "year") {
      const n = t[field];
      const v = Number(value);
      if (op === "gte") return n >= v;
      if (op === "lte") return n <= v;
      return n === v;
    }
    if (field === "genre") {
      const s = String(value).toLowerCase();
      if (op === "contains") return t.genre.toLowerCase().includes(s);
      return t.genre.toLowerCase() === s;
    }
    if (field === "camelot") {
      if (op === "in" && Array.isArray(value)) return value.includes(t.camelot);
      return t.camelot === String(value);
    }
    if (field === "tag") {
      return t.tags.includes(String(value));
    }
    return true;
  });
}

export const loadLibrary = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const userId = await ownerId();
  await ensureLibrary(sql, userId);
  const rows = await sql<TrackRow>`
    select * from tracks where user_id = ${userId} order by artist, album, title
  `;
  const tracks = rows.map(mapTrack);
  const playlists = await loadPlaylists(sql, userId, tracks);
  return { tracks, playlists, userId, albums: CATALOG_ALBUMS.map((a) => a.slug) };
});

export const updateTrackFn = createServerFn({ method: "POST" })
  .validator((input: { id: number; edits: Record<string, unknown> }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const userId = await ownerId();
    await ensureLibrary(sql, userId);
    const allowed = new Set([
      "title",
      "artist",
      "album",
      "genre",
      "label",
      "remixer",
      "bpm",
      "camelot",
      "musical_key",
      "energy",
      "danceability",
      "rating",
      "comment",
      "color",
      "archived",
      "incoming",
      "play_count",
      "cuepoints_json",
      "tags_json",
    ]);
    const edits = { ...data.edits };
    if (Array.isArray(edits.cuepoints)) {
      edits.cuepoints_json = JSON.stringify(edits.cuepoints);
      delete edits.cuepoints;
    }
    if (Array.isArray(edits.tags)) {
      edits.tags_json = JSON.stringify(edits.tags);
      delete edits.tags;
    }
    if (typeof edits.musicalKey === "string") {
      edits.musical_key = edits.musicalKey;
      delete edits.musicalKey;
    }
    if (typeof edits.playCount === "number") {
      edits.play_count = edits.playCount;
      delete edits.playCount;
    }
    const sets: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    for (const [k, v] of Object.entries(edits)) {
      if (!allowed.has(k) || v === undefined) continue;
      sets.push(`${k} = $${i}`);
      values.push(v);
      i += 1;
    }
    if (!sets.length) return { ok: true };
    values.push(data.id, userId);
    await sql.query(
      `update tracks set ${sets.join(", ")} where id = $${i} and user_id = $${i + 1}`,
      values,
    );
    return { ok: true };
  });

export const createPlaylistFn = createServerFn({ method: "POST" })
  .validator((input: { name: string; type: "playlist" | "folder" | "smartlist"; parentId?: number | null }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const userId = await ownerId();
    await ensureLibrary(sql, userId);
    const rows = await sql<{ id: number }>`
      insert into playlists (user_id, name, parent_id, type, position)
      values (${userId}, ${data.name.trim() || "Untitled"}, ${data.parentId ?? null}, ${data.type}, 999)
      returning id
    `;
    return { id: Number(rows[0]?.id) };
  });

export const addToPlaylistFn = createServerFn({ method: "POST" })
  .validator((input: { playlistId: number; trackIds: number[] }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const userId = await ownerId();
    const owned = await sql<{ id: number }>`
      select id from playlists where id = ${data.playlistId} and user_id = ${userId}
    `;
    if (!owned[0]) return { ok: false };
    const existing = await sql<{ track_id: number; position: number }>`
      select track_id, position from playlist_tracks where playlist_id = ${data.playlistId}
    `;
    const have = new Set(existing.map((e) => Number(e.track_id)));
    let pos = existing.reduce((m, e) => Math.max(m, Number(e.position)), -1) + 1;
    for (const id of data.trackIds) {
      if (have.has(id)) continue;
      await sql`
        insert into playlist_tracks (playlist_id, track_id, position)
        values (${data.playlistId}, ${id}, ${pos})
      `;
      pos += 1;
    }
    return { ok: true };
  });

export const deletePlaylistFn = createServerFn({ method: "POST" })
  .validator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const userId = await ownerId();
    await sql`delete from playlist_tracks where playlist_id = ${data.id}`;
    await sql`delete from playlists where id = ${data.id} and user_id = ${userId}`;
    return { ok: true };
  });

export const applyCueTemplateFn = createServerFn({ method: "POST" })
  .validator((input: { trackIds: number[] }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const userId = await ownerId();
    const rows = await sql<TrackRow>`
      select * from tracks where user_id = ${userId}
    `;
    const want = new Set(data.trackIds);
    const selected = rows.filter((r) => want.has(Number(r.id)));
    for (const row of selected) {
      const t = mapTrack(row);
      const bar = (60 / t.bpm) * 4;
      const cues: CuePoint[] = [
        { position: 0, name: "Intro", type: "1", startTime: 0.2, endTime: null, color: "#c4c9ce" },
        { position: 1, name: "Drop", type: "1", startTime: bar * 16, endTime: null, color: "#8fa3b0" },
        { position: 2, name: "Break", type: "1", startTime: bar * 48, endTime: null, color: "#d7dbe0" },
        { position: 3, name: "Drop 2", type: "1", startTime: bar * 64, endTime: null, color: "#6f8290" },
        { position: 4, name: "Outro", type: "1", startTime: Math.max(t.duration - bar * 8, bar * 80), endTime: null, color: "#b7c0c6" },
      ];
      await sql`
        update tracks set cuepoints_json = ${JSON.stringify(cues)}
        where id = ${t.id} and user_id = ${userId}
      `;
    }
    return { ok: true, count: selected.length };
  });

export function rebuildWaveform(seed: number): number[] {
  return buildWaveform(seed);
}
