import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Waveform } from "@/components/waveform";
import { formatDuration } from "@/lib/utils";
import { usePlayer } from "@/lib/player-store";

export function PlayerBar() {
  const current = usePlayer((s) => s.current);
  const playing = usePlayer((s) => s.playing);
  const progress = usePlayer((s) => s.progress);
  const toggle = usePlayer((s) => s.toggle);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const seek = usePlayer((s) => s.seek);
  const jumpCue = usePlayer((s) => s.jumpCue);

  if (!current) {
    return (
      <div className="flex h-[88px] items-center border-t border-border px-4 text-sm text-muted">
        Double-click a track to load the preview engine.
      </div>
    );
  }

  return (
    <div className="grid h-[88px] grid-cols-[auto_1fr_auto] items-center gap-4 border-t border-border bg-surface px-3 md:px-4">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => void prev()} aria-label="Previous">
          <SkipBack className="size-4" />
        </Button>
        <Button
          variant="default"
          size="icon"
          onClick={() => void toggle()}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => void next()} aria-label="Next">
          <SkipForward className="size-4" />
        </Button>
      </div>
      <div className="min-w-0">
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <p className="truncate text-sm">
            {current.title}
            <span className="text-muted"> — {current.artist}</span>
          </p>
          <p className="shrink-0 font-mono text-[11px] tabular text-subtle">
            {formatDuration(progress)} / {formatDuration(current.duration)}
          </p>
        </div>
        <Waveform
          samples={current.waveform}
          progress={progress}
          duration={current.duration}
          cues={current.cuepoints}
          onSeek={seek}
        />
      </div>
      <div className="hidden items-center gap-1 md:flex">
        {Array.from({ length: 8 }).map((_, i) => {
          const cue = current.cuepoints.find((c) => c.position === i);
          return (
            <button
              key={i}
              type="button"
              disabled={!cue}
              onClick={() => jumpCue(i)}
              className="size-8 rounded-[var(--radius-xs)] border border-border font-mono text-[10px] text-muted disabled:opacity-25"
              aria-label={cue ? `Cue ${cue.name}` : `Empty cue ${i + 1}`}
            >
              {String.fromCharCode(65 + i)}
            </button>
          );
        })}
        <span className="ml-2 font-mono text-xs tabular" style={{ color: current.color }}>
          {current.bpm.toFixed(0)} · {current.camelot}
        </span>
      </div>
    </div>
  );
}
