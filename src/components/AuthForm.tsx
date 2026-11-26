import { useState } from "react";
import { neon } from "../lib/neon";
import {
  Film,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Tv,
  Clapperboard,
  BookmarkCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "signup") {
        await neon.auth.signUp.email({
          email: email.trim(),
          password,
          name: email.trim().split("@")[0],
        });

        // With verify-at-signup disabled, attempt immediate sign-in for seamless experience
        try {
          await neon.auth.signIn.email({
            email: email.trim(),
            password,
          });
        } catch {
          setMessage("Account created successfully. Please sign in.");
          setMode("signin");
        }
      } else {
        await neon.auth.signIn.email({
          email: email.trim(),
          password,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setError("");
    setMessage("");
  };

  return (
    <div className="relative grid min-h-screen w-full grid-cols-1 bg-[#09090b] text-zinc-100 lg:grid-cols-12">
      {/* Left Editorial Cinema Panel (Desktop) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.07] bg-[#0c0d10] p-10 xl:p-14 lg:col-span-6 xl:col-span-7 lg:flex">
        {/* Subtle architectural radial light — restrained, non-distracting */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.03),transparent_50%)]"
        />

        {/* Top Brand Identity */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#14161c] shadow-sm">
            <Film className="h-4.5 w-4.5 text-indigo-400" />
          </div>
          <span className="text-base font-semibold tracking-tight text-white">
            Watchlist
          </span>
        </div>

        {/* Center Editorial Statement & Structural Preview */}
        <div className="relative z-10 my-auto max-w-xl space-y-8 py-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-[-0.03em] text-white leading-[1.08] xl:text-5xl">
              Every film, series, and episode in one quiet archive.
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-zinc-400 xl:text-base">
              Organize what you are watching, track progress episode by episode,
              and keep your personal cinema queue effortless to browse.
            </p>
          </div>

          {/* Architectural Library Preview (Structural showcase, no fabricated stats) */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#111217]/90 p-5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7)]">
            <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
              <span className="text-xs font-medium text-zinc-300">
                Library Structure
              </span>
              <span className="text-[11px] text-zinc-400">
                Synced to your account
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/[0.06] bg-[#0b0c10] p-3.5">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-zinc-200">
                  <Film className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-zinc-100">Movies</p>
                <p className="mt-0.5 text-[11px] text-zinc-400">
                  Posters, runtime &amp; status
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#0b0c10] p-3.5">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
                  <Tv className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-zinc-100">TV Series</p>
                <p className="mt-0.5 text-[11px] text-zinc-400">
                  Episode-level tracking
                </p>
                <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
                  <div className="h-full w-2/3 rounded-full bg-indigo-500" />
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#0b0c10] p-3.5">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-zinc-200">
                  <Clapperboard className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-zinc-100">Anime</p>
                <p className="mt-0.5 text-[11px] text-zinc-400">
                  Dedicated rails &amp; filters
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Quiet Footer */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-zinc-400">
          <BookmarkCheck className="h-3.5 w-3.5 text-indigo-400" />
          <span>Private personal watchlist · Movies, Series &amp; Anime</span>
        </div>
      </aside>

      {/* Right Authentication Form Column */}
      <main className="relative flex flex-col justify-between px-5 py-8 sm:px-10 lg:col-span-6 xl:col-span-5 lg:px-12 xl:px-16">
        {/* Mobile Brand Header */}
        <div className="flex items-center justify-between lg:justify-end">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#14161c]">
              <Film className="h-4 w-4 text-indigo-400" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">
              Watchlist
            </span>
          </div>

          <button
            type="button"
            onClick={toggleMode}
            disabled={loading}
            className="text-xs font-medium text-zinc-400 transition-colors hover:text-white cursor-pointer"
          >
            {mode === "signin" ? "Create account" : "Sign in instead"}
          </button>
        </div>

        {/* Centered Form Container */}
        <div className="mx-auto my-auto w-full max-w-[380px] py-10">
          <div className="mb-7 space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-[-0.025em] text-white sm:text-[28px]">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-sm text-zinc-400">
              {mode === "signin"
                ? "Sign in to open your personal watchlist."
                : "Start organizing your movies, series, and anime."}
            </p>
          </div>

          {/* Mode Switcher Pills */}
          <div
            role="tablist"
            aria-label="Authentication mode"
            className="mb-6 grid grid-cols-2 rounded-lg border border-white/[0.08] bg-[#101116] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signin"}
              onClick={() => {
                if (mode !== "signin") toggleMode();
              }}
              disabled={loading}
              className={`h-8 rounded-md text-xs font-medium transition-all cursor-pointer ${
                mode === "signin"
                  ? "bg-white/[0.1] text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              onClick={() => {
                if (mode !== "signup") toggleMode();
              }}
              disabled={loading}
              className={`h-8 rounded-md text-xs font-medium transition-all cursor-pointer ${
                mode === "signup"
                  ? "bg-white/[0.1] text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-500/25 bg-red-950/35 px-3.5 py-3 text-xs text-red-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div
              role="status"
              className="mb-5 flex items-start gap-2.5 rounded-lg border border-emerald-500/25 bg-emerald-950/35 px-3.5 py-3 text-xs text-emerald-200"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span className="leading-relaxed">{message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="auth-email"
                className="block text-xs font-medium text-zinc-300"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  id="auth-email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-lg border border-white/[0.09] bg-[#111217] pl-10 pr-3.5 text-sm text-zinc-100 placeholder:text-zinc-400/65 transition-all focus:border-indigo-500 focus:bg-[#14161c] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="auth-password"
                className="block text-xs font-medium text-zinc-300"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-lg border border-white/[0.09] bg-[#111217] pl-10 pr-10 text-sm text-zinc-100 placeholder:text-zinc-400/65 transition-all focus:border-indigo-500 focus:bg-[#14161c] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                  required
                  disabled={loading}
                  minLength={mode === "signup" ? 8 : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-200 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {mode === "signup" && (
                <p className="text-[11px] text-zinc-400">
                  Minimum 8 characters
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_-6px_rgba(99,102,241,0.5)] transition-all hover:bg-indigo-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              <span>
                {loading
                  ? mode === "signin"
                    ? "Signing in..."
                    : "Creating account..."
                  : mode === "signin"
                  ? "Sign In"
                  : "Create Account"}
              </span>
              {!loading && (
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              )}
            </button>
          </form>

          {/* Toggle Mode Footer */}
          <p className="mt-6 text-center text-xs text-zinc-400">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={toggleMode}
                  disabled={loading}
                  className="font-medium text-indigo-400 underline-offset-4 transition-colors hover:text-indigo-300 hover:underline cursor-pointer"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={toggleMode}
                  disabled={loading}
                  className="font-medium text-indigo-400 underline-offset-4 transition-colors hover:text-indigo-300 hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        {/* Mobile Bottom Caption */}
        <div className="text-center text-[11px] text-zinc-500 lg:text-right">
          Personal cinema &amp; series tracker
        </div>
      </main>
    </div>
  );
}
