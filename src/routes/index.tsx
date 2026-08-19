import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Code2, Disc3, Sparkles, Wand2 } from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="relative z-10 flex items-center justify-between border-b border-border bg-bg px-5 py-4 md:px-10">
        <span className="text-sm font-medium tracking-tight text-fg">GRID</span>
        <nav className="flex items-center gap-5 text-sm text-muted">
          <Link to="/library" className="hover:text-fg">
            Library
          </Link>
          <Link to="/login" className="hover:text-fg">
            Sign in
          </Link>
        </nav>
      </header>

      <section className="relative overflow-hidden px-5 pb-16 pt-10 md:px-10 md:pt-16">
        <img
          src="/hero.jpg"
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/20 via-bg/70 to-bg" />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">DJ library OS</p>
          <h1 className="mt-4 text-4xl font-medium leading-[1.05] tracking-[-0.04em] md:text-6xl">
            One crate.
            <br />
            Every booth.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">
            GRID is library management for DJs who treat metadata like an instrument — beatgrids, hot cues,
            Camelot mixing, and a local REST API you can script against.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/library"
              className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-5 text-sm font-medium text-primary-fg"
            >
              Open library
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex h-11 items-center rounded-[var(--radius-sm)] border border-border px-5 text-sm text-fg"
            >
              Sign in to save
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-px border-y border-border bg-border md:grid-cols-2">
        <Feature
          icon={<Disc3 className="size-4" />}
          title="The crate"
          body="Forty-eight prepared tracks across eight albums. BPM, Camelot, energy, ratings, and cue points already written — click play for a generated groove in key."
        />
        <Feature
          icon={<Sparkles className="size-4" />}
          title="Harmonic mixing"
          body="The Camelot wheel highlights compatible keys. Mixable tracks stay within ±8 BPM so a set actually holds together."
        />
        <Feature
          icon={<Wand2 className="size-4" />}
          title="Plugins"
          body="JavaScript actions run in a sandbox with _library and _control — boost energy, stamp cue templates, or build a mix crate from a seed track."
        />
        <Feature
          icon={<Code2 className="size-4" />}
          title="Local API"
          body="REST at /api/v1, shaped after a professional DJ library API: tracks, playlists, search filters, cue writes. Hit it from the in-app console."
        />
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16 md:px-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-subtle">Try it</p>
        <ol className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            "Open the library and double-click a track — spacebar toggles, keys 1–8 jump hot cues.",
            "Select a peak-time cut, switch to Mix, and read the wheel for the next three records.",
            "In Plugins, run “Build mixable crate”. Then inspect the new playlist or replay the call in API.",
          ].map((step, i) => (
            <li key={step} className="border-t border-border pt-4">
              <span className="font-mono text-xs text-subtle">0{i + 1}</span>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-border px-5 py-8 text-xs text-subtle md:px-10">
        GRID · DJ library OS. Previews are synthesized from BPM and key — no copyrighted audio.
      </footer>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <article className="bg-bg p-6 md:p-8">
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <h2 className="text-sm font-medium text-fg">{title}</h2>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
    </article>
  );
}
