import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/tracks?limit=5", body: "" },
  { method: "GET", path: "/api/v1/track?id=1", body: "" },
  { method: "GET", path: "/api/v1/playlists", body: "" },
  { method: "GET", path: '/api/v1/search/tracks?filter={"genre":"techno"}', body: "" },
  {
    method: "PATCH",
    path: "/api/v1/track",
    body: JSON.stringify({ id: 1, edits: { energy: 9, comment: "Peak-time closer" } }, null, 2),
  },
  {
    method: "POST",
    path: "/api/v1/playlist",
    body: JSON.stringify({ name: "API crate", type: "playlist" }, null, 2),
  },
];

export function ApiConsole() {
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/api/v1/tracks?limit=5");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState("Responses land here. GRID speaks a Lexicon-shaped REST API.");
  const [status, setStatus] = useState<string>("idle");

  async function send() {
    setStatus("…");
    try {
      const res = await fetch(path, {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body: method === "GET" || method === "DELETE" ? undefined : body || undefined,
      });
      const text = await res.text();
      setStatus(String(res.status));
      setResponse(text);
    } catch (err) {
      setStatus("err");
      setResponse(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-border p-3 lg:border-b-0 lg:border-r">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-subtle">Endpoints</p>
        <div className="flex flex-col gap-1">
          {ENDPOINTS.map((ep) => (
            <button
              key={ep.method + ep.path}
              type="button"
              onClick={() => {
                setMethod(ep.method);
                setPath(ep.path);
                setBody(ep.body);
              }}
              className="rounded-[var(--radius-sm)] px-2 py-2 text-left font-mono text-[11px] hover:bg-elevated"
            >
              <span className="text-accent">{ep.method}</span> {ep.path.replace("/api/v1", "")}
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-subtle">
          Same-origin REST. Guests hit the demo crate; signed-in users get a private clone.
        </p>
      </aside>
      <div className="flex min-h-0 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm"
          >
            {["GET", "POST", "PATCH", "DELETE"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <Input value={path} onChange={(e) => setPath(e.target.value)} className="min-w-[180px] flex-1 font-mono text-xs" />
          <Button size="sm" onClick={() => void send()}>
            Send
          </Button>
          <span className="font-mono text-xs text-subtle">{status}</span>
        </div>
        {(method === "POST" || method === "PATCH") && (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            spellCheck={false}
            className="h-32 resize-none border-b border-border bg-bg p-3 font-mono text-xs outline-none"
          />
        )}
        <pre className="min-h-0 flex-1 overflow-auto p-4 font-mono text-[12px] leading-relaxed text-muted">
          {response}
        </pre>
      </div>
    </div>
  );
}
