"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.emailVerified) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--text)]">
        Yükleniyor...
      </div>
    );
  }

  if (user?.emailVerified) {
    return null;
  }

  return <>{children}</>;
};

export default PublicRoute;
