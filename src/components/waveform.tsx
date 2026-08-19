import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { CuePoint } from "@/lib/types";

export function Waveform({
  samples,
  progress,
  duration,
  cues,
  onSeek,
  className,
}: {
  samples: number[];
  progress: number;
  duration: number;
  cues?: CuePoint[];
  onSeek?: (seconds: number) => void;
  className?: string;
}) {
  const bars = useMemo(() => {
    const n = 128;
    if (!samples.length) return Array.from({ length: n }, () => 0.2);
    const out: number[] = [];
    const step = samples.length / n;
    for (let i = 0; i < n; i++) {
      const slice = samples.slice(Math.floor(i * step), Math.floor((i + 1) * step));
      out.push(slice.reduce((a, b) => a + b, 0) / Math.max(1, slice.length));
    }
    return out;
  }, [samples]);

  const pct = duration > 0 ? Math.min(1, progress / duration) : 0;

  return (
    <div
      className={cn("relative h-12 w-full cursor-pointer", className)}
      onClick={(e) => {
        if (!onSeek || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        onSeek(((e.clientX - rect.left) / rect.width) * duration);
      }}
    >
      <div className="flex h-full items-end gap-px">
        {bars.map((v, i) => {
          const active = i / bars.length <= pct;
          return (
            <div
              key={i}
              className="waveform-bar min-w-px flex-1 rounded-[1px]"
              style={{
                height: `${Math.max(8, v * 100)}%`,
                background: active ? "var(--color-accent)" : "color-mix(in oklab, var(--color-fg) 22%, transparent)",
              }}
            />
          );
        })}
      </div>
      {cues?.map((c) => (
        <span
          key={c.position}
          className="absolute top-0 h-full w-px"
          style={{
            left: `${duration ? (c.startTime / duration) * 100 : 0}%`,
            background: "var(--color-primary)",
            opacity: 0.7,
          }}
          title={c.name}
        />
      ))}
    </div>
  );
}
