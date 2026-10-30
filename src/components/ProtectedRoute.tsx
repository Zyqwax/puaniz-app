"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !user.emailVerified)) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--text)]">
        Yükleniyor...
      </div>
    );
  }

  if (!user || !user.emailVerified) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
