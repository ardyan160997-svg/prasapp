"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Users, AlertCircle } from "lucide-react";

function getRedirectFromLocation() {
  if (typeof window === "undefined") {
    return "/dashboard";
  }

  const params = new URLSearchParams(window.location.search);
  return params.get("redirect") || "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const [redirect] = useState(getRedirectFromLocation);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Masukkan password household");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", password }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(redirect);
        router.refresh();
      } else {
        setError(data.error || "Password salah");
      }
    } catch {
      setError("Terjadi kesalahan, coba lagi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card-soft space-y-6">
          <div className="text-center space-y-2">
            <div
              className="inline-flex h-16 w-16 items-center justify-center rounded-3xl mx-auto"
              style={{ backgroundColor: "var(--primary-soft)", color: "var(--primary)" }}
            >
              <Users className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold">Masuk ke PrasFinance</h1>
            <p className="text-sm text-[color:var(--foreground)]/70">
              Masukkan password household untuk mengakses keuangan keluarga
            </p>
          </div>

          {error && (
            <div
              className="flex items-center gap-2 rounded-xl p-3 text-sm"
              style={{ backgroundColor: "var(--primary-soft)", color: "var(--primary)" }}
              role="alert"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium block">
                Password Household
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border px-4 py-3 text-base transition"
                  placeholder="Masukkan password"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface)",
                    color: "var(--foreground)",
                  }}
                  disabled={isLoading}
                  autoComplete="current-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)]/80"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl py-3 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--primary)" }}
            >
              {isLoading ? "Masuk..." : "Masuk ke Dashboard"}
            </button>
          </form>

          <div className="pt-4 text-center">
            <p className="text-xs text-[color:var(--foreground)]/50">
              Default: <code className="px-2 py-0.5 rounded text-xs font-mono">keluarga123</code>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}