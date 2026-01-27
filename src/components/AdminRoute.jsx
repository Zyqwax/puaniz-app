"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export const isAdminUser = (user) => {
  if (!user || !ADMIN_EMAIL) return false;
  return user.email === ADMIN_EMAIL;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth");
      } else if (!isAdminUser(user)) {
        router.push("/");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Yükleniyor...</div>;
  }

  if (!user || !isAdminUser(user)) {
    return null;
  }

  return children;
};

export default AdminRoute;
