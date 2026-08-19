import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Code2, Library, Menu, Search, Sparkles, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlaylistSidebar } from "@/components/sidebar";
import { TrackTable } from "@/components/track-table";
import { Inspector } from "@/components/inspector";
import { PlayerBar } from "@/components/player-bar";
import { MixView } from "@/components/mix-view";
import { PluginStudio } from "@/components/plugin-studio";
import { ApiConsole } from "@/components/api-console";
import { applyCueTemplateFn, loadLibrary } from "@/lib/library";
import { usePlayer } from "@/lib/player-store";
import { UserButton, SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";
import type { Playlist, Track, ViewId } from "@/lib/types";

type Special = "all" | "incoming" | "archive";

export function LibraryApp() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [crate, setCrate] = useState<number | Special>("all");
  const [sortKey, setSortKey] = useState<keyof Track | "time">("artist");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [mobileNav, setMobileNav] = useState<"none" | "crates" | "inspect">("none");

  const view = usePlayer((s) => s.view);
  const setView = usePlayer((s) => s.setView);
  const query = usePlayer((s) => s.query);
  const setQuery = usePlayer((s) => s.setQuery);
  const selectedIds = usePlayer((s) => s.selectedIds);
  const setSelected = usePlayer((s) => s.setSelected);
  const inspectId = usePlayer((s) => s.inspectId);
  const current = usePlayer((s) => s.current);
  const play = usePlayer((s) => s.play);
  const toggle = usePlayer((s) => s.toggle);
  const jumpCue = usePlayer((s) => s.jumpCue);
  const tick = usePlayer((s) => s.tick);
  const { isPending } = useCurrentUserState();

  const reload = useCallback(async () => {
    const data = await loadLibrary();
    setTracks(data.tracks);
    setPlaylists(data.playlists);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (inspectId || !tracks[0]) return;
    setSelected([tracks[0].id]);
  }, [tracks, inspectId, setSelected]);

  useEffect(() => {
    const id = window.setInterval(() => tick(), 200);
    return () => window.clearInterval(id);
  }, [tick]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.code === "Space") {
        e.preventDefault();
        void toggle();
      }
      if (e.key >= "1" && e.key <= "8") jumpCue(Number(e.key) - 1);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("grid-search")?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, jumpCue]);

  const inspect = tracks.find((t) => t.id === inspectId) ?? current ?? null;

  const visible = useMemo(() => {
    let list = tracks;
    if (crate === "archive") list = list.filter((t) => t.archived);
    else if (crate === "incoming") list = list.filter((t) => t.incoming);
    else if (typeof crate === "number") {
      const pl = playlists.find((p) => p.id === crate);
      const ids = new Set(pl?.trackIds ?? []);
      list = list.filter((t) => ids.has(t.id));
    } else {
      list = list.filter((t) => !t.archived);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((t) =>
        [t.title, t.artist, t.album, t.genre, t.camelot, t.tags.join(" ")].join(" ").toLowerCase().includes(q),
      );
    }
    const dir = sortDir === "asc" ? 1 : -1;
    const copy = [...list];
    copy.sort((a, b) => {
      const key = sortKey === "time" ? "duration" : sortKey;
      const av = a[key];
      const bv = b[key];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return copy;
  }, [tracks, playlists, crate, query, sortKey, sortDir]);

  function onSelect(track: Track, e: MouseEvent) {
    if (e.shiftKey && selectedIds.length) {
      const last = selectedIds[selectedIds.length - 1]!;
      const ia = visible.findIndex((t) => t.id === last);
      const ib = visible.findIndex((t) => t.id === track.id);
      const [lo, hi] = ia < ib ? [ia, ib] : [ib, ia];
      setSelected(visible.slice(lo, hi + 1).map((t) => t.id));
      return;
    }
    if (e.metaKey || e.ctrlKey) {
      setSelected(
        selectedIds.includes(track.id) ? selectedIds.filter((id) => id !== track.id) : [...selectedIds, track.id],
      );
      return;
    }
    setSelected([track.id]);
  }

  function onSort(key: keyof Track | "time") {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function generateCues() {
    const ids = selectedIds.length ? selectedIds : inspect ? [inspect.id] : [];
    if (!ids.length) {
      toast("Select tracks first");
      return;
    }
    const res = await applyCueTemplateFn({ data: { trackIds: ids } });
    await reload();
    toast(`Wrote cue template on ${res.count} tracks`);
  }

  const views: { id: ViewId; label: string; icon: typeof Library }[] = [
    { id: "library", label: "Library", icon: Library },
    { id: "mix", label: "Mix", icon: Sparkles },
    { id: "plugins", label: "Plugins", icon: Wand2 },
    { id: "api", label: "API", icon: Code2 },
  ];

  return (
    <div className="flex h-dvh flex-col bg-bg text-fg">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
        <button
          type="button"
          className="md:hidden"
          onClick={() => setMobileNav((v) => (v === "crates" ? "none" : "crates"))}
          aria-label="Crates"
        >
          <Menu className="size-5" />
        </button>
        <Link to="/" className="font-medium tracking-tight">
          GRID
        </Link>
        <div className="relative mx-2 hidden min-w-0 flex-1 md:block md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
          <Input
            id="grid-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search crate"
            className="h-8 pl-8"
          />
        </div>
        <nav className="ml-auto flex items-center gap-1">
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs transition-colors",
                view === v.id ? "bg-elevated text-fg" : "text-muted hover:text-fg",
              )}
            >
              <v.icon className="size-3.5" />
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2 pl-2">
          {isPending ? (
            <div className="size-8 animate-pulse rounded-full bg-elevated" />
          ) : (
            <>
              <SignedOut>
                <Link to="/login" className="text-xs text-muted hover:text-fg">
                  Sign in
                </Link>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </>
          )}
        </div>
      </header>

      {view === "library" && (
        <div className="flex min-h-0 flex-1">
          <div className="hidden min-h-0 md:flex md:w-[220px] md:shrink-0 md:border-r md:border-border">
            <PlaylistSidebar
              playlists={playlists}
              active={crate}
              onSelect={setCrate}
              trackCount={tracks.filter((t) => !t.archived).length}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="border-b border-border px-3 py-2 md:hidden">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search crate"
                className="h-9"
              />
            </div>
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
              <p className="text-xs text-muted">
                {loading ? "Loading crate…" : `${visible.length} tracks`}
                {selectedIds.length > 0 && ` · ${selectedIds.length} selected`}
              </p>
              <Button size="sm" variant="outline" onClick={() => void generateCues()}>
                Generate cues
              </Button>
            </div>
            <div className="relative min-h-0 flex-1">
              <TrackTable
                tracks={visible}
                selectedIds={selectedIds}
                currentId={current?.id ?? null}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
                onSelect={onSelect}
                onPlay={(t) => void play(t, visible)}
              />
            </div>
          </div>
          <div className="hidden min-h-0 w-[300px] shrink-0 border-l border-border lg:block">
            <Inspector track={inspect} onJumpCue={jumpCue} onReload={reload} />
          </div>
        </div>
      )}

      {view === "mix" && (
        <MixView
          tracks={tracks}
          focus={inspect}
          onPlay={(t) => void play(t, tracks)}
          onFocus={(t) => setSelected([t.id])}
        />
      )}
      {view === "plugins" && <PluginStudio tracks={tracks} playlists={playlists} onReload={reload} />}
      {view === "api" && <ApiConsole />}

      <PlayerBar />

      {mobileNav !== "none" && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-bg/70"
            aria-label="Close"
            onClick={() => setMobileNav("none")}
          />
          <div className="absolute inset-y-0 left-0 flex w-[80%] max-w-xs flex-col bg-surface shadow-[var(--shadow-panel)]">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-sm">Crates</span>
              <button type="button" onClick={() => setMobileNav("none")} aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
            <PlaylistSidebar
              playlists={playlists}
              active={crate}
              onSelect={(id) => {
                setCrate(id);
                setMobileNav("none");
              }}
              trackCount={tracks.filter((t) => !t.archived).length}
            />
          </div>
        </div>
      )}
    </div>
  );
}
