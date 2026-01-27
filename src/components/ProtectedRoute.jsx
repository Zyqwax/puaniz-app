"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { WHITELISTED_EMAILS } from "@/constants";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      const isWhitelisted = user && WHITELISTED_EMAILS.includes(user.email);
      if (!user || (!user.emailVerified && !isWhitelisted)) {
        router.push("/auth");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Yükleniyor...</div>;
  }

  const isWhitelisted = user && WHITELISTED_EMAILS.includes(user.email);
  if (!user || (!user.emailVerified && !isWhitelisted)) {
    return null; // Will redirect in useEffect
  }

  return children;
};

export default ProtectedRoute;
