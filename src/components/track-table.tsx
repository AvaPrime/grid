import type { MouseEvent } from "react";
import { Star } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import type { Track } from "@/lib/types";

const COLS = "32px minmax(0,1.6fr) minmax(0,1.1fr) 64px 56px minmax(0,1fr) 88px 64px 48px 72px";

export function TrackTable({
  tracks,
  selectedIds,
  currentId,
  sortKey,
  sortDir,
  onSort,
  onSelect,
  onPlay,
}: {
  tracks: Track[];
  selectedIds: number[];
  currentId: number | null;
  sortKey: keyof Track | "time";
  sortDir: "asc" | "desc";
  onSort: (key: keyof Track | "time") => void;
  onSelect: (track: Track, e: MouseEvent) => void;
  onPlay: (track: Track) => void;
}) {
  const selected = new Set(selectedIds);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="sticky top-0 z-10 hidden items-center gap-2 border-b border-border bg-bg px-3 py-2 text-[10px] font-medium uppercase tracking-[0.14em] text-subtle md:grid"
        style={{ gridTemplateColumns: COLS }}
      >
        <span />
        <Header label="Title" onClick={() => onSort("title")} active={sortKey === "title"} dir={sortDir} />
        <Header label="Artist" onClick={() => onSort("artist")} active={sortKey === "artist"} dir={sortDir} />
        <Header label="BPM" onClick={() => onSort("bpm")} active={sortKey === "bpm"} dir={sortDir} />
        <Header label="Key" onClick={() => onSort("camelot")} active={sortKey === "camelot"} dir={sortDir} />
        <Header label="Genre" onClick={() => onSort("genre")} active={sortKey === "genre"} dir={sortDir} />
        <Header label="Energy" onClick={() => onSort("energy")} active={sortKey === "energy"} dir={sortDir} />
        <Header label="Time" onClick={() => onSort("time")} active={sortKey === "time"} dir={sortDir} />
        <Header label="Year" onClick={() => onSort("year")} active={sortKey === "year"} dir={sortDir} />
        <span />
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {tracks.length === 0 ? (
          <p className="px-4 py-12 text-sm text-muted">No tracks in this crate.</p>
        ) : (
          tracks.map((t) => {
            const isSel = selected.has(t.id);
            const isCur = currentId === t.id;
            return (
              <div
                key={t.id}
                role="button"
                tabIndex={0}
                onClick={(e) => onSelect(t, e)}
                onDoubleClick={() => onPlay(t)}
                className={cn(
                  "border-b border-border/60 px-3 py-2 transition-colors duration-150 md:grid md:items-center md:gap-2 md:py-1.5",
                  isSel ? "bg-elevated" : "hover:bg-elevated/50",
                )}
                style={{ gridTemplateColumns: COLS }}
              >
                <div className="flex items-center gap-3 md:contents">
                  <img
                    src={`/covers/${t.albumSlug}.jpg`}
                    alt=""
                    className="size-10 rounded-[3px] object-cover md:size-7"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-[13px]", isCur && "text-accent")}>{t.title}</p>
                    <p className="truncate text-[11px] text-subtle md:hidden">{t.artist}</p>
                  </div>
                  <div className="shrink-0 text-right font-mono text-xs tabular md:hidden">
                    <p>{t.bpm.toFixed(0)}</p>
                    <p style={{ color: t.color }}>{t.camelot}</p>
                  </div>
                </div>
                <span className="hidden truncate text-[13px] text-muted md:block">{t.artist}</span>
                <span className="hidden font-mono text-xs tabular text-fg md:block">{t.bpm.toFixed(0)}</span>
                <span className="hidden font-mono text-xs tabular md:block" style={{ color: t.color }}>
                  {t.camelot}
                </span>
                <span className="hidden truncate text-[13px] text-muted md:block">{t.genre}</span>
                <Energy value={t.energy} />
                <span className="hidden font-mono text-xs tabular text-muted md:block">
                  {formatDuration(t.duration)}
                </span>
                <span className="hidden text-[13px] text-muted md:block">{t.year}</span>
                <span className="hidden justify-end text-subtle md:flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="size-2.5"
                      fill={i < t.rating ? "currentColor" : "none"}
                      strokeWidth={1.5}
                    />
                  ))}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Header({
  label,
  onClick,
  active,
  dir,
}: {
  label: string;
  onClick?: () => void;
  active?: boolean;
  dir?: "asc" | "desc";
}) {
  if (!onClick) return <span />;
  return (
    <button type="button" onClick={onClick} className={cn("text-left", active && "text-fg")}>
      {label}
      {active ? (dir === "asc" ? " ↑" : " ↓") : ""}
    </button>
  );
}

function Energy({ value }: { value: number }) {
  return (
    <span className="hidden items-center gap-px md:flex">
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className="h-2.5 w-1 rounded-[1px]"
          style={{
            background:
              i < value
                ? "var(--color-accent)"
                : "color-mix(in oklab, var(--color-fg) 14%, transparent)",
          }}
        />
      ))}
    </span>
  );
}
