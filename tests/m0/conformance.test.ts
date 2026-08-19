import assert from "node:assert/strict";
import { test } from "node:test";
import { toApiPlaylist, toApiTrack } from "../../src/lib/api-shape";
import { compatibleKeys } from "../../src/lib/camelot";
import {
  DomainError,
  MIX_BPM_WINDOW,
  assertCanonicalEnergy,
  assertOwned,
  assertParentFolder,
  assertSameCrate,
  isMixablePair,
  matchSmart,
  validateCuepoints,
} from "../../src/lib/domain";
import type { GridImportIR } from "../../src/lib/import-ir";
import { mixableFor } from "../../src/lib/mix";
import type { CuePoint, Playlist, SmartRule, Track } from "../../src/lib/types";

function track(over: Partial<Track> & Pick<Track, "id" | "userId" | "bpm" | "camelot">): Track {
  return {
    title: `T${over.id}`,
    artist: "X",
    album: "",
    albumSlug: "",
    genre: "Techno",
    label: "",
    remixer: "",
    musicalKey: "Am",
    energy: 5,
    danceability: 5,
    rating: 4,
    duration: 400,
    year: 2024,
    playCount: 0,
    comment: "",
    color: "#8fa3b0",
    archived: false,
    incoming: false,
    seed: 1,
    waveform: [],
    cuepoints: [],
    tags: [],
    ...over,
  };
}

function playlist(over: Partial<Playlist> & Pick<Playlist, "id" | "userId" | "type">): Playlist {
  return {
    name: "P",
    parentId: null,
    position: 0,
    smartlist: null,
    trackIds: [],
    ...over,
  };
}

test("M0-TC-001 track identity is (userId, id)", () => {
  const a = track({ id: 1, userId: "u1", bpm: 124, camelot: "8A", title: "Same" });
  const b = track({ id: 1, userId: "u2", bpm: 124, camelot: "8A", title: "Same" });
  assert.notEqual(a.userId, b.userId);
  assert.equal(a.id, b.id);
});

test("M0-TC-002 ownership isolation rejects cross-crate and demo-as-proof", () => {
  assert.doesNotThrow(() => assertOwned("u1", "u1"));
  assert.throws(() => assertOwned("u1", "u2"), DomainError);
  assert.throws(() => assertOwned("demo", "demo"), /shared seed/);
});

test("M0-TC-003 crate semantics: playlist membership does not own tracks", () => {
  const t = track({ id: 7, userId: "u1", bpm: 120, camelot: "8A" });
  const crate = playlist({ id: 2, userId: "u1", type: "playlist", trackIds: [7] });
  assert.ok(crate.trackIds.includes(t.id));
  const afterDelete = playlist({ ...crate, trackIds: [] });
  assert.equal(t.id, 7);
  assert.equal(afterDelete.trackIds.length, 0);
});

test("M0-TC-004 playlist nesting: parent must be a same-crate folder", () => {
  const folder = playlist({ id: 1, userId: "u1", type: "folder" });
  const list = playlist({ id: 2, userId: "u1", type: "playlist" });
  assert.doesNotThrow(() => assertParentFolder(folder));
  assert.throws(() => assertParentFolder(list), DomainError);
  assert.doesNotThrow(() => assertSameCrate(folder, "u1"));
  assert.throws(() => assertSameCrate(folder, "u2"), DomainError);
});

test("M0-TC-005 cuepoint validation: slots, hotcue null end, loop endTime", () => {
  const hot: CuePoint = {
    position: 0,
    name: "Intro",
    type: "1",
    startTime: 1,
    endTime: null,
    color: "#c4c9ce",
  };
  const loop: CuePoint = {
    position: 1,
    name: "Loop 8",
    type: "5",
    startTime: 16,
    endTime: 32,
    color: "#8fa3b0",
  };
  assert.doesNotThrow(() => validateCuepoints([hot, loop], 400));
  assert.throws(() => validateCuepoints([{ ...hot, endTime: 8 }], 400), /hotcues/);
  assert.throws(() => validateCuepoints([{ ...loop, endTime: null }], 400), /loops/);
  assert.throws(() => validateCuepoints([hot, { ...loop, position: 0 }], 400), /duplicate/);
});

test("M0-TC-006 Camelot compatibility: same and ±1 with wrap", () => {
  const keys = compatibleKeys("1A");
  assert.ok(keys.has("1A"));
  assert.ok(keys.has("12A"));
  assert.ok(keys.has("2A"));
  assert.ok(!keys.has("3A"));
  const twelve = compatibleKeys("12B");
  assert.ok(twelve.has("11B") && twelve.has("1B") && twelve.has("12A"));
});

test("M0-TC-007 relative major/minor", () => {
  assert.ok(compatibleKeys("8A").has("8B"));
  assert.ok(compatibleKeys("8B").has("8A"));
  assert.ok(!compatibleKeys("8A").has("7B"));
});

test("M0-TC-008 BPM ±8 boundary is compatible", () => {
  const a = track({ id: 1, userId: "u", bpm: 124, camelot: "8A" });
  const b = track({ id: 2, userId: "u", bpm: 124 + MIX_BPM_WINDOW, camelot: "8A" });
  assert.equal(MIX_BPM_WINDOW, 8);
  assert.ok(isMixablePair(a, b));
  assert.ok(mixableFor(a, [a, b]).some((t) => t.id === 2));
});

test("M0-TC-009 BPM 8.01 is incompatible", () => {
  const a = track({ id: 1, userId: "u", bpm: 124, camelot: "8A" });
  const b = track({ id: 2, userId: "u", bpm: 124 + 8.01, camelot: "8A" });
  assert.equal(isMixablePair(a, b), false);
  assert.equal(mixableFor(a, [a, b]).length, 0);
});

test("M0-TC-010 no double-time membership", () => {
  const a = track({ id: 1, userId: "u", bpm: 87, camelot: "8A" });
  const b = track({ id: 2, userId: "u", bpm: 174, camelot: "8A" });
  assert.equal(isMixablePair(a, b), false);
});

test("M0-TC-006/008 mix compatibility is symmetric", () => {
  const a = track({ id: 1, userId: "u", bpm: 124, camelot: "8A" });
  const b = track({ id: 2, userId: "u", bpm: 126, camelot: "9A" });
  assert.ok(isMixablePair(a, b));
  assert.ok(isMixablePair(b, a));
  const all = [a, b];
  assert.ok(mixableFor(a, all).some((t) => t.id === b.id));
  assert.ok(mixableFor(b, all).some((t) => t.id === a.id));
});

test("M0-TC-011 energy 0–10 accepted", () => {
  assert.doesNotThrow(() => assertCanonicalEnergy(0));
  assert.doesNotThrow(() => assertCanonicalEnergy(10));
});

test("M0-TC-012 energy out of range rejected", () => {
  assert.throws(() => assertCanonicalEnergy(11), DomainError);
  assert.throws(() => assertCanonicalEnergy(-1), DomainError);
  assert.throws(() => assertCanonicalEnergy(0.74), DomainError);
});

test("M0-TC-013 smartlist valid rule evaluates", () => {
  const hot = track({ id: 1, userId: "u", bpm: 128, camelot: "8A", energy: 9 });
  const warm = track({ id: 2, userId: "u", bpm: 118, camelot: "8A", energy: 4 });
  const rules: SmartRule[] = [{ field: "energy", op: "gte", value: 8 }];
  assert.equal(matchSmart(hot, rules), true);
  assert.equal(matchSmart(warm, rules), false);
});

test("M0-TC-014 smartlist unknown field fails", () => {
  const t = track({ id: 1, userId: "u", bpm: 120, camelot: "8A" });
  const rule = { field: "tension", op: "gte", value: 1 } as unknown as SmartRule;
  assert.throws(() => matchSmart(t, [rule]), /unknown smartlist field/);
});

test("M0-TC-015 smartlist unknown operator fails", () => {
  const t = track({ id: 1, userId: "u", bpm: 120, camelot: "8A" });
  const rule = { field: "energy", op: "approx", value: 5 } as unknown as SmartRule;
  assert.throws(() => matchSmart(t, [rule]), /unknown smartlist operator/);
});

test("M0-TC-016 smartlist malformed operand fails", () => {
  const t = track({ id: 1, userId: "u", bpm: 120, camelot: "8A" });
  assert.throws(
    () => matchSmart(t, [{ field: "energy", op: "gte", value: "hot" }]),
    /operand must be a number/,
  );
  assert.throws(
    () => matchSmart(t, [{ field: "camelot", op: "in", value: "8A" }]),
    /string\[\]/,
  );
});

test("M0-TC-017 REST track shape", () => {
  const wire = toApiTrack({
    id: 3,
    title: "Lanterns",
    artist: "Mira Voss",
    album: "Night Market",
    genre: "Afro House",
    label: "Eastline",
    remixer: "",
    bpm: 122,
    camelot: "8A",
    energy: 6,
    rating: 5,
    duration: 421,
    year: 2024,
    play_count: 2,
    comment: "",
    color: "#8fa3b0",
    archived: false,
    cuepoints_json: "[]",
    tags_json: '["peak"]',
  });
  assert.equal(wire.albumTitle, "Night Market");
  assert.equal(wire.key, "8A");
  assert.equal(wire.archived, 0);
  assert.deepEqual(wire.tags, ["peak"]);
  assert.ok(!("camelot" in wire));
  assert.ok(!("userId" in wire));
});

test("M0-TC-018 REST playlist shape", () => {
  const wire = toApiPlaylist(
    playlist({
      id: 4,
      userId: "u1",
      type: "smartlist",
      name: "Energy 8+",
      smartlist: [{ field: "energy", op: "gte", value: 8 }],
      trackIds: [1, 2],
    }),
  );
  assert.equal(wire.type, "3");
  assert.equal(wire.parentId, null);
  assert.deepEqual(wire.trackIds, [1, 2]);
  assert.ok(!("userId" in wire));
});

test("M0-TC-019 cue write authorization is ownership", () => {
  assert.throws(() => assertOwned("u1", "u2"), DomainError);
  assert.doesNotThrow(() => assertOwned("u1", "u1"));
});

test("M0-TC-020 import boundary is reserved off Track", () => {
  const ir: GridImportIR = {
    source: "rekordbox-xml",
    sourceRef: "rekordbox:42",
    title: "Lanterns After Rain",
    artist: "Mira Voss",
    bpm: 122,
    camelot: "8A",
    duration: 421,
  };
  const t = track({ id: 1, userId: "u", bpm: 122, camelot: "8A" });
  assert.equal("sourceRef" in t, false);
  assert.equal("source" in t, false);
  assert.ok(ir.sourceRef);
});
