"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  LogOut,
  CheckCircle,
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

const AuthClient = () => {
  const { user: authUser, loading: authLoading } = useAuth();
  const [view, setView] = useState("login"); // login, register, forgot-password, verify-email
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
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // If user is already logged in but not verified, show verification screen
  useEffect(() => {
    if (!authLoading && authUser) {
      const isWhitelisted = WHITELISTED_EMAILS.includes(authUser.email);
      if (!authUser.emailVerified && !isWhitelisted) {
        setView("verify-email");
        setEmail(authUser.email);
      }
    }
  }, [authUser, authLoading]);

  const handleAuth = async (e) => {
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
        const isWhitelisted = WHITELISTED_EMAILS.includes(user.email);

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
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          grade: "",
        });

        setView("verify-email");
        setMessage("Kayıt başarılı! Lütfen e-postanızı doğrulayın.");
      } else if (view === "forgot-password") {
        await sendPasswordResetEmail(auth, email);
        setMessage("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
        setTimeout(() => setView("login"), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.message.replace("Firebase:", "").trim());
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
    } catch (err) {
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
    } catch (err) {
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
        setResendCooldown(60); // 1 minute cooldown
      } else {
        setError("Oturum zaman aşımına uğradı. Lütfen tekrar giriş yapın.");
        setView("login");
      }
    } catch (err) {
      console.error(err);
      if (err.code === "auth/too-many-requests") {
        setError("Çok fazla istek gönderildi. Lütfen biraz bekleyin.");
      } else {
        setError(
          "Mail gönderilemedi: " + err.message.replace("Firebase:", "").trim(),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <RefreshCw className="animate-spin text-purple-500" size={32} />
      </div>
    );
  }

  return (
    <PublicRoute>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel w-full max-w-md p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-purple-500 to-pink-500" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

          {view === "verify-email" ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="text-purple-400" size={32} />
              </div>
              <h2 className="text-3xl font-bold mb-4 bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                E-postanı Doğrula
              </h2>
              <p className="text-slate-400 mb-8">
                {email || (authUser && authUser.email)} adresine bir doğrulama
                bağlantısı gönderdik. Devam etmek için lütfen mailindeki
                bağlantıya tıkla.
              </p>
              {message && (
                <p className="text-green-400 text-sm mb-4">{message}</p>
              )}
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

              <div className="space-y-3">
                <button
                  onClick={handleCheckVerification}
                  disabled={loading}
                  className="glass-btn w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="animate-spin" size={20} />
                  ) : (
                    <CheckCircle size={20} />
                  )}
                  Doğrulamayı Kontrol Et
                </button>

                <button
                  onClick={handleResendEmail}
                  disabled={loading || resendCooldown > 0}
                  className="w-full py-2 bg-white/5 border border-white/10 rounded-lg text-slate-300 hover:bg-white/10 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Mail size={16} />
                  {resendCooldown > 0
                    ? `Tekrar Gönder (${resendCooldown}s)`
                    : "Doğrulama Mailini Tekrar Gönder"}
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full py-2 text-slate-400 hover:text-white transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <LogOut size={16} /> Farklı Hesapla Giriş Yap
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-center mb-2 bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {view === "login" && "Tekrar Hoşgeldin!"}
                {view === "register" && "Hemen Başla"}
                {view === "forgot-password" && "Şifremi Unuttum"}
              </h2>
              <p className="text-center text-slate-400 mb-8">
                {view === "login" &&
                  "Hesabına giriş yap ve netlerini takibe başla."}
                {view === "register" &&
                  "YKS sürecini verilerle yönetmeye başla."}
                {view === "forgot-password" &&
                  "E-posta adresini girerek şifreni sıfırlayabilirsin."}
              </p>

              <form onSubmit={handleAuth} className="space-y-4">
                {view === "register" && (
                  <div className="relative group">
                    <User
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-400 transition-colors"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="Adın Soyadın"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="glass-input w-full pl-10"
                      required
                    />
                  </div>
                )}

                <div className="relative group">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-400 transition-colors"
                    size={20}
                  />
                  <input
                    type="email"
                    placeholder="E-posta Adresi"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input w-full pl-10"
                    required
                  />
                </div>

                {view !== "forgot-password" && (
                  <div className="relative group">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-400 transition-colors"
                      size={20}
                    />
                    <input
                      type="password"
                      placeholder="Şifre"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="glass-input w-full pl-10"
                      required
                    />
                  </div>
                )}

                {view === "login" && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setView("forgot-password")}
                      className="text-xs text-slate-400 hover:text-purple-400 transition-colors"
                    >
                      Şifremi Unuttum
                    </button>
                  </div>
                )}

                {error && (
                  <p className="text-red-400 text-sm text-center">{error}</p>
                )}
                {message && (
                  <p className="text-green-400 text-sm text-center">
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="glass-btn w-full flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="animate-spin" size={20} />
                  ) : (
                    <>
                      {view === "login" && "Giriş Yap"}
                      {view === "register" && "Kayıt Ol"}
                      {view === "forgot-password" &&
                        "Sıfırlama Bağlantısı Gönder"}
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center space-y-2">
                {view === "forgot-password" ? (
                  <button
                    onClick={() => setView("login")}
                    className="text-slate-400 hover:text-white transition-colors text-sm cursor-pointer flex items-center justify-center gap-1 mx-auto"
                  >
                    <ArrowLeft size={14} /> Giriş Ekranına Dön
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      setView(view === "login" ? "register" : "login")
                    }
                    className="text-slate-400 hover:text-white transition-colors text-sm cursor-pointer"
                  >
                    {view === "login"
                      ? "Hesabın yok mu? Kayıt Ol"
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
