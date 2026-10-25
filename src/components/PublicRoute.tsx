"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { WHITELISTED_EMAILS } from "@/constants";

export const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const isWhitelisted = user.email && WHITELISTED_EMAILS.includes(user.email);
      if (user.emailVerified || isWhitelisted) {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--text)]">
        Yükleniyor...
      </div>
    );
  }

  const isWhitelisted = user?.email && WHITELISTED_EMAILS.includes(user.email);
  if (user && (user.emailVerified || isWhitelisted)) {
    return null;
  }

  return <>{children}</>;
};

export default PublicRoute;
