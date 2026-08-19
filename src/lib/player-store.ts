import { create } from "zustand";
import { gridEngine } from "./audio-engine";
import type { Track, ViewId } from "./types";

type PlayerState = {
  current: Track | null;
  queue: Track[];
  playing: boolean;
  progress: number;
  selectedIds: number[];
  inspectId: number | null;
  playlistId: number | null;
  view: ViewId;
  query: string;
  play: (track: Track, queue?: Track[]) => Promise<void>;
  toggle: () => Promise<void>;
  seek: (seconds: number) => void;
  jumpCue: (index: number) => void;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  setSelected: (ids: number[], inspect?: boolean) => void;
  setPlaylist: (id: number | null) => void;
  setView: (view: ViewId) => void;
  setQuery: (q: string) => void;
  tick: () => void;
};

export const usePlayer = create<PlayerState>((set, get) => ({
  current: null,
  queue: [],
  playing: false,
  progress: 0,
  selectedIds: [],
  inspectId: null,
  playlistId: null,
  view: "library",
  query: "",

  play: async (track, queue) => {
    const q = queue ?? get().queue;
    set({ current: track, queue: q.length ? q : [track], playing: true, inspectId: track.id });
    await gridEngine.play(track, 0);
  },

  toggle: async () => {
    const { current, playing } = get();
    if (!current) return;
    if (playing) {
      gridEngine.pause();
      set({ playing: false, progress: gridEngine.progressSeconds() });
    } else {
      await gridEngine.play(current, gridEngine.progressSeconds());
      set({ playing: true });
    }
  },

  seek: (seconds) => {
    gridEngine.seek(seconds);
    set({ progress: seconds });
  },

  jumpCue: (index) => {
    const { current } = get();
    if (!current) return;
    const cue = current.cuepoints.find((c) => c.position === index);
    if (!cue) return;
    gridEngine.seek(cue.startTime);
    set({ progress: cue.startTime, playing: true });
    if (!gridEngine.isPlaying()) void gridEngine.play(current, cue.startTime);
  },

  next: async () => {
    const { current, queue } = get();
    if (!queue.length) return;
    const i = Math.max(0, queue.findIndex((t) => t.id === current?.id));
    const n = queue[(i + 1) % queue.length];
    if (n) await get().play(n, queue);
  },

  prev: async () => {
    const { current, queue } = get();
    if (!queue.length) return;
    const i = Math.max(0, queue.findIndex((t) => t.id === current?.id));
    const n = queue[(i - 1 + queue.length) % queue.length];
    if (n) await get().play(n, queue);
  },

  setSelected: (ids, inspect = true) => {
    set({
      selectedIds: ids,
      inspectId: inspect ? (ids[ids.length - 1] ?? get().inspectId) : get().inspectId,
    });
  },

  setPlaylist: (id) => set({ playlistId: id }),
  setView: (view) => set({ view }),
  setQuery: (q) => set({ query: q }),
  tick: () => {
    if (!get().playing) return;
    const t = gridEngine.progressSeconds();
    const cur = get().current;
    if (cur && t >= cur.duration) {
      void get().next();
      return;
    }
    set({ progress: t });
  },
}));
