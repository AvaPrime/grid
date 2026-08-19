import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-fg">
      <div className="w-full max-w-sm">
        <Link to="/" className="text-xs font-medium tracking-tight text-fg">
          GRID
        </Link>
        <h1 className="mt-6 text-2xl font-medium tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Your crate clones the demo library so edits, playlists, and plugins stay on your account.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {authEnabled ? (
            GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => signIn(p.providerId, { callbackURL: "/library" })}
              >
                Continue with {p.label}
              </Button>
            ))
          ) : (
            <p className="text-sm text-muted">Sign-in is disabled.</p>
          )}
        </div>
        <Link to="/library" className="mt-6 inline-block text-sm text-muted hover:text-fg">
          Browse the demo crate instead
        </Link>
      </div>
    </main>
  );
}
