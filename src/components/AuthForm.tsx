import { useState } from "react";
import { neon } from "../lib/neon";
import { Film, Loader2 } from "lucide-react";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="relative flex min-h-screen w-full items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Background Ambience / Gradient Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/2 h-[400px] w-[500px] -translate-x-1/2 rounded-full bg-slate-800/20 blur-[100px]" />
      </div>

      {/* Centered Auth Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg shadow-indigo-500/25">
            <Film className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {mode === "signin" ? "Sign in to Watchlist" : "Create an account"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            {mode === "signin"
              ? "Sign in to access your personal watchlist"
              : "Start tracking your movies, series, and anime"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className="mb-4 rounded-lg border border-emerald-900/60 bg-emerald-950/40 p-3 text-xs text-emerald-300">
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="auth-email"
              className="text-xs font-medium text-slate-300"
            >
              Email address
            </label>
            <input
              id="auth-email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="auth-password"
              className="text-xs font-medium text-slate-300"
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
              disabled={loading}
              minLength={mode === "signup" ? 8 : undefined}
            />
            {mode === "signup" && (
              <p className="text-[11px] text-slate-500">
                Minimum 8 characters
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>
              {loading
                ? mode === "signin"
                  ? "Signing in..."
                  : "Creating account..."
                : mode === "signin"
                ? "Sign In"
                : "Create Account"}
            </span>
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 border-t border-slate-800/80 pt-4 text-center text-xs text-slate-400">
          {mode === "signin" ? (
            <p>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={toggleMode}
                disabled={loading}
                className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={toggleMode}
                disabled={loading}
                className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
