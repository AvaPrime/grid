import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDuration } from "@/lib/utils";
import { updateTrackFn } from "@/lib/library";
import type { Track } from "@/lib/types";

export function Inspector({
  track,
  onJumpCue,
  onReload,
}: {
  track: Track | null;
  onJumpCue: (index: number) => void;
  onReload: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  if (!track) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-muted">
        Select a track to inspect cues, tags, and metadata.
      </div>
    );
  }

  async function save(edits: Record<string, unknown>) {
    setBusy(true);
    try {
      await updateTrackFn({ data: { id: track!.id, edits } });
      await onReload();
      toast("Track updated");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <img
        src={`/covers/${track.albumSlug}.jpg`}
        alt={`${track.album} cover`}
        className="aspect-square w-full object-cover"
      />
      <div className="flex flex-col gap-4 p-4">
        <div>
          <h2 className="text-base font-medium leading-snug">{track.title}</h2>
          <p className="text-sm text-muted">{track.artist}</p>
          <p className="mt-1 text-xs text-subtle">
            {track.album} · {track.label} · {track.year}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-3 font-mono text-xs tabular">
          <Stat label="BPM" value={track.bpm.toFixed(1)} />
          <Stat label="Key" value={`${track.camelot} · ${track.musicalKey}`} color={track.color} />
          <Stat label="Energy" value={`${track.energy}/10`} />
          <Stat label="Time" value={formatDuration(track.duration)} />
        </dl>
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-subtle">Hot cues</p>
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => {
              const cue = track.cuepoints.find((c) => c.position === i);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!cue}
                  onClick={() => onJumpCue(i)}
                  className="rounded-[var(--radius-xs)] border border-border px-1 py-2 text-left disabled:opacity-30"
                >
                  <span className="block font-mono text-[10px] text-subtle">{String.fromCharCode(65 + i)}</span>
                  <span className="block truncate text-[11px]">{cue?.name ?? "—"}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-subtle">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {track.tags.length ? (
              track.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-xs text-subtle">No tags</span>
            )}
          </div>
        </div>
        <label className="grid gap-1 text-xs text-muted">
          Comment
          <Input
            defaultValue={track.comment}
            disabled={busy}
            onBlur={(e) => {
              if (e.target.value !== track.comment) void save({ comment: e.target.value });
            }}
          />
        </label>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void save({ rating: Math.min(5, track.rating + 1) })}
          >
            Rate up
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void save({ energy: Math.min(10, track.energy + 1) })}
          >
            Energy +
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-border bg-surface px-2.5 py-2">
      <dt className="text-[10px] uppercase tracking-[0.12em] text-subtle">{label}</dt>
      <dd className="mt-0.5 text-sm text-fg" style={color ? { color } : undefined}>
        {value}
      </dd>
    </div>
  );
}
