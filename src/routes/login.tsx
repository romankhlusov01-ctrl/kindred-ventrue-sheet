import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  return (
    <main className="grid min-h-[calc(100dvh-var(--grok-banner-h,0px))] place-items-center p-6">
      <div className="w-full max-w-sm space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <div>
          <h1 className="font-display text-xl tracking-wide">Вход</h1>
          <p className="mt-1 text-sm text-muted">
            Лист работает без входа (сохранение в браузере). Аккаунт — по желанию.
          </p>
        </div>
        {authEnabled ? (
          <div className="space-y-2">
            {GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
              >
                Войти через {p.label}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Вход отключён.</p>
        )}
        <Link to="/" className="block text-center text-sm text-primary hover:underline">
          ← К листу персонажа
        </Link>
      </div>
    </main>
  );
}
