import type { ReactNode } from "react";
import { Archive, Folder, ListMusic, Sparkles, Disc3, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Playlist } from "@/lib/types";

type Special = "all" | "incoming" | "archive";

export function PlaylistSidebar({
  playlists,
  active,
  onSelect,
  trackCount,
}: {
  playlists: Playlist[];
  active: number | Special;
  onSelect: (id: number | Special) => void;
  trackCount: number;
}) {
  const roots = playlists.filter((p) => p.parentId === null);

  return (
    <nav className="flex h-full flex-col gap-4 overflow-y-auto p-3 text-sm">
      <div>
        <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-[0.14em] text-subtle">Library</p>
        <SideItem
          icon={<Disc3 className="size-3.5" />}
          label="All tracks"
          count={trackCount}
          active={active === "all"}
          onClick={() => onSelect("all")}
        />
        <SideItem
          icon={<Inbox className="size-3.5" />}
          label="Incoming"
          active={active === "incoming"}
          onClick={() => onSelect("incoming")}
        />
        <SideItem
          icon={<Archive className="size-3.5" />}
          label="Archive"
          active={active === "archive"}
          onClick={() => onSelect("archive")}
        />
      </div>
      <div>
        <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-[0.14em] text-subtle">Crates</p>
        {roots.map((node) => (
          <Tree key={node.id} node={node} all={playlists} active={active} onSelect={onSelect} depth={0} />
        ))}
      </div>
    </nav>
  );
}

function Tree({
  node,
  all,
  active,
  onSelect,
  depth,
}: {
  node: Playlist;
  all: Playlist[];
  active: number | Special;
  onSelect: (id: number | Special) => void;
  depth: number;
}) {
  const kids = all.filter((p) => p.parentId === node.id);
  const Icon = node.type === "folder" ? Folder : node.type === "smartlist" ? Sparkles : ListMusic;
  return (
    <div>
      <SideItem
        icon={<Icon className="size-3.5" />}
        label={node.name}
        count={node.type === "folder" ? undefined : node.trackIds.length}
        active={active === node.id}
        onClick={() => onSelect(node.id)}
        depth={depth}
      />
      {kids.map((k) => (
        <Tree key={k.id} node={k} all={all} active={active} onSelect={onSelect} depth={depth + 1} />
      ))}
    </div>
  );
}

function SideItem({
  icon,
  label,
  count,
  active,
  onClick,
  depth = 0,
}: {
  icon: ReactNode;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  depth?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-[var(--radius-xs)] px-2 py-1.5 text-left transition-colors duration-150",
        active ? "bg-elevated text-fg" : "text-muted hover:bg-elevated/70 hover:text-fg",
      )}
      style={{ paddingLeft: 8 + depth * 12 }}
    >
      <span className="text-subtle">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count != null && <span className="font-mono text-[10px] text-subtle tabular">{count}</span>}
    </button>
  );
}
