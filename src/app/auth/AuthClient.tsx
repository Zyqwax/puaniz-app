"use client";

import React, { useState, useEffect, type FormEvent } from "react";
import {
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  LogOut,
  CircleCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { updateUserProfile } from "@/services/userService";
import PublicRoute from "@/components/PublicRoute";
import { useAuth } from "@/context/AuthContext";
import { WHITELISTED_EMAILS } from "@/constants";
import PuanizLogo from "@/components/PuanizLogo";
import Link from "next/link";

type AuthView = "login" | "register" | "forgot-password" | "verify-email";

const AuthClient: React.FC = () => {
  const { user: authUser, loading: authLoading } = useAuth();
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const router = useRouter();

  // Cooldown timer for resend email
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  // If user is already logged in but not verified, show verification screen
  useEffect(() => {
    if (!authLoading && authUser) {
      const userEmail = authUser.email || "";
      const isWhitelisted = WHITELISTED_EMAILS.includes(userEmail);
      if (!authUser.emailVerified && !isWhitelisted) {
        setView("verify-email");
        setEmail(userEmail);
      }
    }
  }, [authUser, authLoading]);

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (view === "login") {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const user = userCredential.user;
        const isWhitelisted = WHITELISTED_EMAILS.includes(user.email || "");

        if (!user.emailVerified && !isWhitelisted) {
          await sendEmailVerification(user);
          setView("verify-email");
          setMessage("Doğrulama maili gönderildi.");
        } else {
          router.push("/dashboard");
        }
      } else if (view === "register") {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });
        await sendEmailVerification(user);

        await updateUserProfile(user.uid, {
          name: name,
          email: email,
          createdAt: new Date(),
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2F6BFF&color=fff&bold=true`,
          grade: "",
        });

        setView("verify-email");
        setMessage("Kayıt başarılı! Lütfen e-postanızı doğrulayın.");
      } else if (view === "forgot-password") {
        await sendPasswordResetEmail(auth, email);
        setMessage("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
        setTimeout(() => setView("login"), 3000);
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu";
      setError(msg.replace("Firebase:", "").trim());
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          setMessage("E-posta başarıyla doğrulandı! Yönlendiriliyorsunuz...");
          setTimeout(() => router.push("/dashboard"), 1500);
        } else {
          setError(
            "E-posta henüz doğrulanmamış görünüyor. Lütfen gelen kutunuzu kontrol edin.",
          );
        }
      }
    } catch {
      setError("Doğrulama durumu kontrol edilemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setView("login");
      setEmail("");
      setPassword("");
    } catch {
      setError("Çıkış yapılamadı.");
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;

    setError("");
    setMessage("");
    setLoading(true);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setMessage("Doğrulama maili tekrar gönderildi.");
        setResendCooldown(60);
      } else {
        setError("Oturum zaman aşımına uğradı. Lütfen tekrar giriş yapın.");
        setView("login");
      }
    } catch (err: unknown) {
      console.error(err);
      const errorObj = err as { code?: string; message?: string };
      if (errorObj.code === "auth/too-many-requests") {
        setError("Çok fazla istek gönderildi. Lütfen biraz bekleyin.");
      } else {
        const msg = errorObj.message || "Mail gönderilemedi.";
        setError("Mail gönderilemedi: " + msg.replace("Firebase:", "").trim());
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <RefreshCw className="animate-spin text-[var(--brand)]" size={32} />
      </div>
    );
  }

  return (
    <PublicRoute>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--bg)]">
        {/* Brand Logo Header */}
        <div className="mb-6">
          <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
            <PuanizLogo height={40} />
          </Link>
        </div>

        <div className="w-full max-w-md bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--brand)]" />

          {view === "verify-email" ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--brand-soft)] rounded-2xl flex items-center justify-center mx-auto mb-6 text-[var(--brand)]">
                <Mail size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-[var(--text)]">
                E-postanı Doğrula
              </h2>
              <p className="text-[var(--text-muted)] text-sm mb-6 leading-relaxed">
                <span className="font-semibold text-[var(--text)]">{email || (authUser && authUser.email)}</span> adresine bir doğrulama
                bağlantısı gönderdik. Devam etmek için lütfen mailindeki
                bağlantıya tıkla.
              </p>
              {message && (
                <p className="text-[var(--ok)] font-semibold text-sm mb-4">{message}</p>
              )}
              {error && <p className="text-[var(--err)] font-semibold text-sm mb-4">{error}</p>}

              <div className="space-y-3">
                <button
                  onClick={handleCheckVerification}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-bold rounded-2xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="animate-spin" size={18} />
                  ) : (
                    <CircleCheck size={18} />
                  )}
                  Doğrulamayı Kontrol Et
                </button>

                <button
                  onClick={handleResendEmail}
                  disabled={loading || resendCooldown > 0}
                  className="w-full py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)] hover:bg-[var(--surface-3)] font-semibold transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Mail size={16} className="text-[var(--brand)]" />
                  {resendCooldown > 0
                    ? `Tekrar Gönder (${resendCooldown}s)`
                    : "Doğrulama Mailini Tekrar Gönder"}
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full py-2 text-[var(--text-muted)] hover:text-[var(--text)] font-medium transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut size={16} /> Farklı Hesapla Giriş Yap
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-extrabold text-center mb-1 text-[var(--text)]">
                {view === "login" && "Tekrar Hoş Geldin!"}
                {view === "register" && "Hemen Başla"}
                {view === "forgot-password" && "Şifremi Unuttum"}
              </h2>
              <p className="text-center text-[var(--text-muted)] text-sm mb-6">
                {view === "login" &&
                  "Hesabına giriş yap ve netlerini takibe başla."}
                {view === "register" &&
                  "YKS sürecini veriler ve yapay zeka ile yönetmeye başla."}
                {view === "forgot-password" &&
                  "E-posta adresini girerek şifreni sıfırlayabilirsin."}
              </p>

              <form onSubmit={handleAuth} className="space-y-4">
                {view === "register" && (
                  <div className="relative">
                    <UserIcon
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Adın Soyadın"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-2xl text-[var(--text)] text-sm font-medium placeholder:text-[var(--text-subtle)] focus:outline-none focus:bg-[var(--surface)] focus:border-[#7FB0FF] focus:ring-2 focus:ring-[#7FB0FF]/25 transition-all"
                      required
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
                    size={18}
                  />
                  <input
                    type="email"
                    placeholder="E-posta Adresi"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-2xl text-[var(--text)] text-sm font-medium placeholder:text-[var(--text-subtle)] focus:outline-none focus:bg-[var(--surface)] focus:border-[#7FB0FF] focus:ring-2 focus:ring-[#7FB0FF]/25 transition-all"
                    required
                  />
                </div>

                {view !== "forgot-password" && (
                  <div className="relative">
                    <Lock
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
                      size={18}
                    />
                    <input
                      type="password"
                      placeholder="Şifre"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-2xl text-[var(--text)] text-sm font-medium placeholder:text-[var(--text-subtle)] focus:outline-none focus:bg-[var(--surface)] focus:border-[#7FB0FF] focus:ring-2 focus:ring-[#7FB0FF]/25 transition-all"
                      required
                    />
                  </div>
                )}

                {view === "login" && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setView("forgot-password")}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--link)] font-semibold transition-colors cursor-pointer"
                    >
                      Şifremi Unuttum
                    </button>
                  </div>
                )}

                {error && (
                  <p className="text-[var(--err)] font-semibold text-xs text-center">{error}</p>
                )}
                {message && (
                  <p className="text-[var(--ok)] font-semibold text-xs text-center">
                    {message}
                  </p>
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
                      {view === "login" && "Giriş Yap"}
                      {view === "register" && "Hesap Oluştur"}
                      {view === "forgot-password" &&
                        "Sıfırlama Bağlantısı Gönder"}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center space-y-2">
                {view === "forgot-password" ? (
                  <button
                    onClick={() => setView("login")}
                    className="text-[var(--text-muted)] hover:text-[var(--text)] font-semibold transition-colors text-sm cursor-pointer flex items-center justify-center gap-1 mx-auto"
                  >
                    <ArrowLeft size={14} /> Giriş Ekranına Dön
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      setView(view === "login" ? "register" : "login")
                    }
                    className="text-[var(--text-muted)] hover:text-[var(--link)] font-semibold transition-colors text-sm cursor-pointer"
                  >
                    {view === "login"
                      ? "Hesabın yok mu? Hemen Kayıt Ol"
                      : "Zaten hesabın var mı? Giriş Yap"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </PublicRoute>
  );
};

export default AuthClient;
