"use client";

import React, { useState } from "react";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { updateUserProfile } from "@/services/userService";
import PublicRoute from "@/components/PublicRoute";

const AuthClient = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });

        await updateUserProfile(user.uid, {
          name: name,
          email: email,
          createdAt: new Date(),
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          grade: "",
        });
      }
      router.push("/");
    } catch (err) {
      console.error(err);
      setError(err.message.replace("Firebase:", "").trim());
    }
  };

  return (
    <PublicRoute>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel w-full max-w-md p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-purple-500 to-pink-500" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-3xl font-bold text-center mb-2 bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {isLogin ? "Tekrar Hoşgeldin!" : "Hemen Başla"}
          </h2>
          <p className="text-center text-slate-400 mb-8">
            {isLogin ? "Hesabına giriş yap ve netlerini takibe başla." : "YKS sürecini verilerle yönetmeye başla."}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
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

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button type="submit" className="glass-btn w-full flex items-center justify-center gap-2 mt-6">
              {isLogin ? "Giriş Yap" : "Kayıt Ol"}
              <ArrowRight size={20} />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-slate-400 hover:text-white transition-colors text-sm cursor-pointer"
            >
              {isLogin ? "Hesabın yok mu? Kayıt Ol" : "Zaten hesabın var mı? Giriş Yap"}
            </button>
          </div>
        </div>
      </div>
    </PublicRoute>
  );
};

export default AuthClient;
