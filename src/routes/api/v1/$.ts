import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/verify.server";
import { toApiTrack } from "@/lib/api-shape";
import {
  DomainError,
  assertCamelot,
  assertCanonicalEnergy,
  assertCanonicalRating,
  matchSmart,
} from "@/lib/domain";
import { DEMO_USER, ensureLibrary } from "@/lib/library";
import type { SmartRule, Track } from "@/lib/types";

export const Route = createFileRoute("/api/v1/$")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
      PATCH: ({ request }) => handle(request),
      DELETE: ({ request }) => handle(request),
    },
  },
});

async function handle(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\/v1\/?/, "").replace(/\/$/, "");
    const method = request.method.toUpperCase();
    const sql = await getSql();
    const session = await getSessionUser();
    const userId = session?.id ?? DEMO_USER;
    await ensureLibrary(sql, userId);

    if (method === "GET" && path === "tracks") {
      const limit = Math.min(1000, Number(url.searchParams.get("limit") ?? 1000));
      const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0));
      const totalRows = await sql<{
        n: number;
      }>`select count(*)::int as n from tracks where user_id = ${userId}`;
      const rows = await sql<Record<string, unknown>>`
        select * from tracks where user_id = ${userId} order by artist, title
        limit ${limit} offset ${offset}
      `;
      return json({
        data: { total: Number(totalRows[0]?.n), limit, offset, tracks: rows.map(toApiTrack) },
      });
    }

    if (method === "GET" && path === "track") {
      const id = Number(url.searchParams.get("id"));
      const rows = await sql<
        Record<string, unknown>
      >`select * from tracks where id = ${id} and user_id = ${userId}`;
      if (!rows[0]) return json({ error: "Not found" }, 400);
      return json({ data: { track: toApiTrack(rows[0]) } });
    }

    if (method === "PATCH" && path === "track") {
      const body = (await request.json()) as { id: number; edits: Record<string, unknown> };
      if (!body?.id || !body.edits) return json({ error: "id and edits required" }, 400);
      if (typeof body.edits.energy === "number") assertCanonicalEnergy(body.edits.energy);
      if (typeof body.edits.rating === "number") assertCanonicalRating(body.edits.rating);
      if (typeof body.edits.camelot === "string") assertCamelot(body.edits.camelot);
      const allowed = [
        "title",
        "artist",
        "album",
        "genre",
        "label",
        "bpm",
        "camelot",
        "energy",
        "rating",
        "comment",
      ];
      const sets: string[] = [];
      const values: unknown[] = [];
      let i = 1;
      for (const key of allowed) {
        if (body.edits[key] === undefined) continue;
        const col = key === "camelot" ? "camelot" : key;
        sets.push(`${col} = $${i}`);
        values.push(body.edits[key]);
        i += 1;
      }
      if (Array.isArray(body.edits.cuepoints)) {
        sets.push(`cuepoints_json = $${i}`);
        values.push(JSON.stringify(body.edits.cuepoints));
        i += 1;
      }
      if (Array.isArray(body.edits.tags)) {
        sets.push(`tags_json = $${i}`);
        values.push(JSON.stringify(body.edits.tags));
        i += 1;
      }
      if (!sets.length) return json({ data: { ok: true } });
      values.push(body.id, userId);
      await sql.query(
        `update tracks set ${sets.join(", ")} where id = $${i} and user_id = $${i + 1}`,
        values,
      );
      return json({ data: { ok: true } });
    }

    if (method === "GET" && path === "search/tracks") {
      const filterRaw = url.searchParams.get("filter");
      let filter: Record<string, string> = {};
      if (filterRaw) {
        try {
          filter = JSON.parse(filterRaw) as Record<string, string>;
        } catch {
          filter = {};
        }
      }
      const rows = await sql<
        Record<string, unknown>
      >`select * from tracks where user_id = ${userId}`;
      const tracks = rows.map(toApiTrack).filter((t) => {
        return Object.entries(filter).every(([k, v]) => {
          const val = String((t as Record<string, unknown>)[k] ?? "").toLowerCase();
          const q = String(v).toLowerCase();
          if (k === "bpm" && q.startsWith(">=")) return Number(t.bpm) >= Number(q.slice(2));
          if (k === "bpm" && q.startsWith("<=")) return Number(t.bpm) <= Number(q.slice(2));
          if (k === "energy" && q.startsWith(">=")) return Number(t.energy) >= Number(q.slice(2));
          return val.includes(q);
        });
      });
      return json({ data: { total: tracks.length, limit: tracks.length, offset: 0, tracks } });
    }

    if (method === "GET" && path === "playlists") {
      const playlists = await loadPlaylistsApi(sql, userId);
      return json({ data: { playlists } });
    }

    if (method === "GET" && path === "playlist") {
      const id = Number(url.searchParams.get("id"));
      const playlists = await loadPlaylistsApi(sql, userId);
      const playlist = playlists.find((p) => p.id === id);
      if (!playlist) return json({ error: "Not found" }, 400);
      return json({ data: { playlist } });
    }

    if (method === "POST" && path === "playlist") {
      const body = (await request.json()) as { name: string; type?: string; parentId?: number };
      if (!body?.name) return json({ error: "name required" }, 400);
      const type =
        body.type === "1" || body.type === "folder"
          ? "folder"
          : body.type === "3" || body.type === "smartlist"
            ? "smartlist"
            : "playlist";
      const rows = await sql<{ id: number }>`
        insert into playlists (user_id, name, parent_id, type, position)
        values (${userId}, ${body.name}, ${body.parentId ?? null}, ${type}, 999)
        returning id
      `;
      return json({ data: { id: Number(rows[0]?.id) } });
    }

    if (method === "PATCH" && path === "playlist-tracks") {
      const body = (await request.json()) as { id: number; trackIds: number[] };
      if (!body?.id || !body.trackIds) return json({ error: "id and trackIds required" }, 400);
      const owned = await sql<{
        id: number;
      }>`select id from playlists where id = ${body.id} and user_id = ${userId}`;
      if (!owned[0]) return json({ error: "Not found" }, 400);
      const existing = await sql<{
        position: number;
      }>`select position from playlist_tracks where playlist_id = ${body.id}`;
      let pos = existing.reduce((m, e) => Math.max(m, Number(e.position)), -1) + 1;
      for (const tid of body.trackIds) {
        await sql.query(
          `insert into playlist_tracks (playlist_id, track_id, position) values ($1,$2,$3)
           on conflict (playlist_id, track_id) do nothing`,
          [body.id, tid, pos],
        );
        pos += 1;
      }
      return json({ data: { ok: true } });
    }

    if (method === "GET" && (path === "" || path === "openapi")) {
      return json({
        name: "GRID Local API",
        version: "1.0.0",
        endpoints: [
          "GET /tracks",
          "GET /track?id=",
          "PATCH /track",
          "GET /search/tracks?filter=",
          "GET /playlists",
          "GET /playlist?id=",
          "POST /playlist",
          "PATCH /playlist-tracks",
        ],
      });
    }

    return json({ error: `Unknown route ${method} /${path}` }, 404);
  } catch (err) {
    if (err instanceof DomainError) return json({ error: err.message }, 400);
    const message = err instanceof Error ? err.message : "Server error";
    return json({ error: message }, 500);
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function parse<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== "string") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function loadPlaylistsApi(sql: Awaited<ReturnType<typeof getSql>>, userId: string) {
  const rows = await sql<{
    id: number;
    name: string;
    parent_id: number | null;
    type: string;
    position: number;
    smartlist_json: string | null;
  }>`select id, name, parent_id, type, position, smartlist_json from playlists where user_id = ${userId} order by position`;
  const links = await sql<{ playlist_id: number; track_id: number }>`
    select pt.playlist_id, pt.track_id from playlist_tracks pt
    join playlists p on p.id = pt.playlist_id where p.user_id = ${userId} order by pt.position
  `;
  const by = new Map<number, number[]>();
  for (const l of links) {
    const arr = by.get(Number(l.playlist_id)) ?? [];
    arr.push(Number(l.track_id));
    by.set(Number(l.playlist_id), arr);
  }
  const tracks = await sql<{
    id: number;
    genre: string;
    energy: number;
    rating: number;
    camelot: string;
    bpm: number;
    year: number;
    tags_json: string;
  }>`select id, genre, energy, rating, camelot, bpm, year, tags_json from tracks where user_id = ${userId}`;

  return rows.map((r) => {
    const smart = parse<SmartRule[] | null>(r.smartlist_json, null);
    let trackIds = by.get(Number(r.id)) ?? [];
    if (r.type === "smartlist" && smart) {
      trackIds = tracks.filter((t) => matchSmart(asSmartTrack(t), smart)).map((t) => Number(t.id));
    }
    return {
      id: Number(r.id),
      name: r.name,
      parentId: r.parent_id === null ? null : Number(r.parent_id),
      type: r.type === "folder" ? "1" : r.type === "smartlist" ? "3" : "2",
      position: Number(r.position),
      trackIds,
      smartlist: smart,
    };
  });
}

function asSmartTrack(row: {
  id: number;
  genre: string;
  energy: number;
  rating: number;
  camelot: string;
  bpm: number;
  year: number;
  tags_json: string;
}): Track {
  return {
    id: Number(row.id),
    userId: "",
    title: "",
    artist: "",
    album: "",
    albumSlug: "",
    genre: row.genre,
    label: "",
    remixer: "",
    bpm: Number(row.bpm),
    camelot: row.camelot,
    musicalKey: "",
    energy: Number(row.energy),
    danceability: 0,
    rating: Number(row.rating),
    duration: 1,
    year: Number(row.year),
    playCount: 0,
    comment: "",
    color: "",
    archived: false,
    incoming: false,
    seed: 0,
    waveform: [],
    cuepoints: [],
    tags: parse(row.tags_json, [] as string[]),
  };
}
