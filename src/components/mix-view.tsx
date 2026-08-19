import { CAMELOT, compatibleKeys } from "@/lib/camelot";
import { mixableFor } from "@/lib/mix";
import { cn, formatDuration } from "@/lib/utils";
import type { Track } from "@/lib/types";

export function MixView({
  tracks,
  focus,
  onPlay,
  onFocus,
}: {
  tracks: Track[];
  focus: Track | null;
  onPlay: (track: Track) => void;
  onFocus: (track: Track) => void;
}) {
  const key = focus?.camelot ?? "8A";
  const compat = compatibleKeys(key);
  const mixable = focus ? mixableFor(focus, tracks) : [];
  const counts = new Map<string, number>();
  for (const t of tracks) counts.set(t.camelot, (counts.get(t.camelot) ?? 0) + 1);

  return (
    <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-4 lg:grid-cols-[minmax(280px,380px)_1fr]">
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle">Camelot wheel</p>
        <p className="mt-1 text-sm text-muted">
          {focus ? `Harmonic neighbours of ${focus.title}` : "Select a track, then pick a key."}
        </p>
        <Wheel selected={key} compat={compat} counts={counts} />
      </div>
      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-medium">Mixable tracks</h2>
            <p className="text-sm text-muted">Same or adjacent key, BPM within ±8.</p>
          </div>
          <span className="font-mono text-xs text-subtle tabular">{mixable.length} matches</span>
        </div>
        <div className="flex flex-col gap-1">
          {mixable.length === 0 && (
            <p className="rounded-[var(--radius-md)] border border-border px-4 py-8 text-sm text-muted">
              Load a track in the library to see harmonic matches.
            </p>
          )}
          {mixable.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onFocus(t)}
              onDoubleClick={() => onPlay(t)}
              className="grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-[var(--radius-sm)] border border-transparent px-2 py-2 text-left hover:border-border hover:bg-elevated"
            >
              <img src={`/covers/${t.albumSlug}.jpg`} alt="" className="size-10 rounded-[var(--radius-xs)] object-cover" />
              <span>
                <span className="block text-sm">{t.title}</span>
                <span className="block text-xs text-muted">
                  {t.artist} · {t.genre}
                </span>
              </span>
              <span className="text-right font-mono text-xs tabular">
                <span style={{ color: t.color }}>{t.camelot}</span>
                <span className="block text-subtle">
                  {t.bpm.toFixed(0)} · {formatDuration(t.duration)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Wheel({
  selected,
  compat,
  counts,
}: {
  selected: string;
  compat: Set<string>;
  counts: Map<string, number>;
}) {
  const cx = 140;
  const cy = 140;
  const innerR = 48;
  const midR = 88;
  const outerR = 128;

  function wedge(i: number, ring: "A" | "B") {
    const id = `${i + 1}${ring}`;
    const start = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const end = ((i + 1) / 12) * Math.PI * 2 - Math.PI / 2;
    const r0 = ring === "A" ? innerR : midR;
    const r1 = ring === "A" ? midR : outerR;
    const p = (r: number, a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
    const a0 = p(r0, start);
    const a1 = p(r1, start);
    const b1 = p(r1, end);
    const b0 = p(r0, end);
    const d = `M ${a0[0]} ${a0[1]} L ${a1[0]} ${a1[1]} A ${r1} ${r1} 0 0 1 ${b1[0]} ${b1[1]} L ${b0[0]} ${b0[1]} A ${r0} ${r0} 0 0 0 ${a0[0]} ${a0[1]}`;
    const entry = CAMELOT.find((c) => c.id === id);
    const tm = p((r0 + r1) / 2, (start + end) / 2);
    const isSel = id === selected;
    const isCompat = compat.has(id);
    return (
      <g key={id}>
        <path
          d={d}
          fill={isSel ? "var(--color-primary)" : isCompat ? "var(--color-elevated)" : "var(--color-surface)"}
          stroke="var(--color-border)"
          strokeWidth={1}
        />
        <text
          x={tm[0]}
          y={tm[1]}
          textAnchor="middle"
          dominantBaseline="middle"
          className={cn("fill-muted", isSel && "fill-primary-fg")}
          style={{ fontSize: 9, fontFamily: "var(--font-mono)" }}
        >
          {id}
        </text>
        {!!counts.get(id) && (
          <title>
            {id} {entry?.musical} · {counts.get(id)} tracks
          </title>
        )}
      </g>
    );
  }

  return (
    <svg viewBox="0 0 280 280" className="mx-auto mt-2 w-full max-w-[320px]">
      {Array.from({ length: 12 }, (_, i) => wedge(i, "B"))}
      {Array.from({ length: 12 }, (_, i) => wedge(i, "A"))}
      <circle cx={cx} cy={cy} r={innerR - 2} fill="var(--color-bg)" stroke="var(--color-border)" />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-fg"
        style={{ fontSize: 13, fontFamily: "var(--font-mono)" }}
      >
        {selected}
      </text>
    </svg>
  );
}
