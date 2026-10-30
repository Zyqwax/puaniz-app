"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, ArrowRight, RefreshCw, CircleCheck } from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import PuanizLogo from "@/components/PuanizLogo";

const ResetPasswordForm: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Sıfırlama bağlantısı geçersiz. Lütfen tekrar talep edin.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (resetError) {
        setError(resetError.message || "Şifre güncellenemedi.");
      } else {
        setDone(true);
        setTimeout(() => router.push("/auth"), 2000);
      }
    } catch {
      setError("Şifre güncellenemedi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--bg)]">
      <div className="mb-6">
        <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
          <PuanizLogo height={40} />
        </Link>
      </div>

      <div className="w-full max-w-md bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--brand)]" />

        {done ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-[var(--brand-soft)] rounded-2xl flex items-center justify-center mx-auto mb-6 text-[var(--brand)]">
              <CircleCheck size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-[var(--text)]">
              Şifren Güncellendi
            </h2>
            <p className="text-[var(--text-muted)] text-sm mb-6 leading-relaxed">
              Yeni şifrenle giriş yapmak için giriş ekranına yönlendiriliyorsun...
            </p>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-bold rounded-2xl transition-colors"
            >
              Giriş Ekranına Git <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-extrabold text-center mb-1 text-[var(--text)]">
              Yeni Şifre Belirle
            </h2>
            <p className="text-center text-[var(--text-muted)] text-sm mb-6">
              Hesabın için yeni bir şifre oluştur.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
                  size={18}
                />
                <input
                  type="password"
                  placeholder="Yeni şifre"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-2xl text-[var(--text)] text-sm font-medium placeholder:text-[var(--text-subtle)] focus:outline-none focus:bg-[var(--surface)] focus:border-[#7FB0FF] focus:ring-2 focus:ring-[#7FB0FF]/25 transition-all"
                />
              </div>

              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
                  size={18}
                />
                <input
                  type="password"
                  placeholder="Yeni şifre (tekrar)"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-2xl text-[var(--text)] text-sm font-medium placeholder:text-[var(--text-subtle)] focus:outline-none focus:bg-[var(--surface)] focus:border-[#7FB0FF] focus:ring-2 focus:ring-[#7FB0FF]/25 transition-all"
                />
              </div>

              {error && (
                <p className="text-[var(--err)] font-semibold text-xs text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="animate-spin" size={18} />
                ) : (
                  <>
                    Şifreyi Güncelle <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/auth"
                className="text-[var(--text-muted)] hover:text-[var(--link)] font-semibold transition-colors text-sm"
              >
                Giriş ekranına dön
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ResetPasswordClient: React.FC = () => (
  <Suspense
    fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <RefreshCw className="animate-spin text-[var(--brand)]" size={32} />
      </div>
    }
  >
    <ResetPasswordForm />
  </Suspense>
);

export default ResetPasswordClient;
