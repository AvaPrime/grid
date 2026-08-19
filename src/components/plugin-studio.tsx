import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  addToPlaylistFn,
  applyCueTemplateFn,
  createPlaylistFn,
  updateTrackFn,
} from "@/lib/library";
import { usePlayer } from "@/lib/player-store";
import type { Playlist, Track } from "@/lib/types";

const EXAMPLES: { id: string; name: string; description: string; code: string }[] = [
  {
    id: "energy",
    name: "Boost energy",
    description: "Add +1 energy to every selected track.",
    code: `const selected = await _library.track.selected();
for (const t of selected) {
  await _library.track.update(t.id, { energy: Math.min(10, t.energy + 1) });
}
return \`Boosted \${selected.length} tracks\`;`,
  },
  {
    id: "cues",
    name: "Generate cue template",
    description: "Write intro / drop / break / outro cues from BPM.",
    code: `const selected = await _library.track.selected();
await _library.control.applyCueTemplate(selected.map(t => t.id));
return \`Wrote cues on \${selected.length} tracks\`;`,
  },
  {
    id: "mixcrate",
    name: "Build mixable crate",
    description: "Create a playlist of harmonic matches for the first selected track.",
    code: `const [seed] = await _library.track.selected();
if (!seed) return "Select a seed track first";
const keys = _library.mix.compatible(seed.camelot);
const matches = _library.track.list().filter(t =>
  t.id !== seed.id && keys.has(t.camelot) && Math.abs(t.bpm - seed.bpm) <= 8
);
const pl = await _library.playlist.create({ name: seed.title + " mix", type: "playlist" });
await _library.playlist.addTracks(pl.id, [seed.id, ...matches.map(t => t.id)]);
return \`Crate \${pl.id} with \${matches.length + 1} tracks\`;`,
  },
  {
    id: "tag",
    name: "Tag peak-time",
    description: "Tag energy 8+ tracks as peak.",
    code: `const hot = _library.track.list().filter(t => t.energy >= 8);
for (const t of hot) {
  const tags = Array.from(new Set([...t.tags, "peak"]));
  await _library.track.update(t.id, { tags });
}
return \`Tagged \${hot.length} peak-time tracks\`;`,
  },
];

export function PluginStudio({
  tracks,
  playlists,
  onReload,
}: {
  tracks: Track[];
  playlists: Playlist[];
  onReload: () => Promise<void>;
}) {
  const selectedIds = usePlayer((s) => s.selectedIds);
  const play = usePlayer((s) => s.play);
  const [code, setCode] = useState(EXAMPLES[0]!.code);
  const [log, setLog] = useState<string>("Ready. Plugins run in a sandbox against the live library.");
  const [running, setRunning] = useState(false);

  const api = useMemo(() => makeApi(tracks, playlists, selectedIds, play), [tracks, playlists, selectedIds, play]);

  async function run() {
    setRunning(true);
    const started = performance.now();
    try {
      const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (
        ...args: string[]
      ) => (...args: unknown[]) => Promise<unknown>;
      const fn = new AsyncFunction("_library", "_settings", '"use strict";\n' + code);
      const result = await fn(api, { dryRun: false });
      await onReload();
      const ms = Math.round(performance.now() - started);
      const msg = result == null ? `Finished in ${ms}ms` : `${String(result)} (${ms}ms)`;
      setLog(msg);
      toast(msg);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setLog(`Error: ${message}`);
      toast.error(message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-border p-3 lg:border-b-0 lg:border-r">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-subtle">Actions</p>
        <div className="flex flex-col gap-1">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => {
                setCode(ex.code);
                setLog(ex.description);
              }}
              className="rounded-[var(--radius-sm)] px-2 py-2 text-left text-sm hover:bg-elevated"
            >
              <span className="block">{ex.name}</span>
              <span className="block text-xs text-muted">{ex.description}</span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-subtle">
          Selected: {selectedIds.length} track{selectedIds.length === 1 ? "" : "s"}
        </p>
      </aside>
      <div className="flex min-h-0 flex-col">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="min-h-[220px] flex-1 resize-none bg-bg p-4 font-mono text-[13px] leading-relaxed text-fg outline-none"
        />
        <div className="flex items-center justify-between gap-3 border-t border-border bg-surface px-4 py-3">
          <p className="min-w-0 truncate font-mono text-xs text-muted">{log}</p>
          <Button size="sm" onClick={() => void run()} disabled={running}>
            {running ? "Running…" : "Run action"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function makeApi(
  tracks: Track[],
  playlists: Playlist[],
  selectedIds: number[],
  play: (track: Track, queue?: Track[]) => Promise<void>,
) {
  return {
    track: {
      list: () => tracks,
      get: (id: number) => tracks.find((t) => t.id === id) ?? null,
      selected: async () => tracks.filter((t) => selectedIds.includes(t.id)),
      update: async (id: number, edits: Record<string, unknown>) => {
        await updateTrackFn({ data: { id, edits } });
      },
    },
    playlist: {
      list: () => playlists,
      create: async (opts: { name: string; type?: "playlist" | "folder" | "smartlist" }) => {
        return createPlaylistFn({ data: { name: opts.name, type: opts.type ?? "playlist" } });
      },
      addTracks: async (id: number, trackIds: number[]) => {
        await addToPlaylistFn({ data: { playlistId: id, trackIds } });
      },
    },
    mix: {
      compatible: (key: string) => {
        const m = /^(\d+)([AB])$/.exec(key);
        if (!m) return new Set([key]);
        const n = Number(m[1]);
        const letter = m[2] as "A" | "B";
        const flip = letter === "A" ? "B" : "A";
        const prev = n === 1 ? 12 : n - 1;
        const next = n === 12 ? 1 : n + 1;
        return new Set([key, `${prev}${letter}`, `${next}${letter}`, `${n}${flip}`]);
      },
    },
    control: {
      play: async (id: number) => {
        const t = tracks.find((x) => x.id === id);
        if (t) await play(t, tracks);
      },
      applyCueTemplate: async (ids: number[]) => {
        await applyCueTemplateFn({ data: { trackIds: ids } });
      },
    },
  };
}
