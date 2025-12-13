import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type LoginFormState = {
  email: string;
  password: string;
};

type LoginErrorState = {
  message: string;
  retryAfterSeconds?: number;
};

function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes}m`;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAsDemo } = useAuth();

  const [form, setForm] = useState<LoginFormState>({
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<LoginErrorState | null>(null);

  const [cooldownUntilMs, setCooldownUntilMs] = useState<number | null>(null);
  const cooldownRemainingSeconds = useMemo(() => {
    if (!cooldownUntilMs) return 0;
    const deltaMs = cooldownUntilMs - Date.now();
    return Math.max(0, Math.ceil(deltaMs / 1000));
  }, [cooldownUntilMs]);

  useEffect(() => {
    if (!cooldownUntilMs) return;
    if (cooldownRemainingSeconds <= 0) return;

    const id = window.setInterval(() => {
      // trigger memo recompute
      setCooldownUntilMs((prev) => prev);
    }, 250);

    return () => window.clearInterval(id);
  }, [cooldownUntilMs, cooldownRemainingSeconds]);

  const isCooldownActive = cooldownRemainingSeconds > 0;

  async function handleDemoLogin() {
    await loginAsDemo();
    const redirectPath = (location.state as { from?: Location } | null)?.from
      ? (location.state as { from?: Location }).from!.pathname
      : "/dashboard";
    navigate(redirectPath, { replace: true });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (isCooldownActive) {
      setError({
        message: `Please wait ${formatWait(cooldownRemainingSeconds)} before trying again.`,
        retryAfterSeconds: cooldownRemainingSeconds,
      });
      return;
    }

    // NOTE: This is forward-compatible scaffolding.
    // Replace these endpoints once backend auth is finalized.
    setSubmitting(true);
    try {
      const res = await api.post<{ user?: unknown }>("/auth/login", {
        email: form.email,
        password: form.password,
      });

      if (res.ok) {
        const redirectPath = (location.state as { from?: Location } | null)?.from
          ? (location.state as { from?: Location }).from!.pathname
          : "/dashboard";
        navigate(redirectPath, { replace: true });
        return;
      }

      if (res.isRateLimited) {
        const retryAfterSeconds = res.retryAfterSeconds ?? 30;
        setCooldownUntilMs(Date.now() + retryAfterSeconds * 1000);
        setError({
          message:
            res.error?.explanation_for_humans ??
            `Too many login attempts. Try again in ${formatWait(retryAfterSeconds)}.`,
          retryAfterSeconds,
        });
        return;
      }

      setError({
        message:
          res.error?.explanation_for_humans ??
          res.error?.message ??
          "Login failed. Please check your credentials and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-6 max-w-sm">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-50">Operator login</h1>
        <p className="text-sm text-slate-300">
          This console uses secure sessions (cookies). If you’re rate-limited,
          we’ll pause client-side retries to protect the system.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm text-slate-200">Email</span>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            type="email"
            autoComplete="username"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
            disabled={submitting}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-slate-200">Password</span>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, password: e.target.value }))
            }
            required
            disabled={submitting}
          />
        </label>

        {error ? (
          <div
            className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
            role="alert"
          >
            {error.message}
          </div>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
          disabled={submitting || isCooldownActive}
        >
          {isCooldownActive
            ? `Try again in ${formatWait(cooldownRemainingSeconds)}`
            : submitting
              ? "Signing in…"
              : "Sign in"}
        </button>
      </form>

      <div className="border-t border-slate-800 pt-4">
        <button
          type="button"
          onClick={handleDemoLogin}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-900"
          disabled={submitting}
        >
          Continue with demo operator
        </button>
      </div>
    </section>
  );
}
