"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { getUserProfile } from "@/server/actions/profile";
import type { SessionUser, UserProfile } from "@/types";

interface AuthContextType {
  user: SessionUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  reloadUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  logout: async () => {},
  reloadUserProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const toSessionUser = (user: {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified: boolean;
}): SessionUser => ({
  id: user.id,
  uid: user.id,
  email: user.email,
  name: user.name,
  displayName: user.name,
  image: user.image ?? null,
  photoURL: user.image ?? null,
  avatarUrl: user.image ?? null,
  emailVerified: user.emailVerified,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, isPending, refetch } = authClient.useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const sessionUser = session?.user ? toSessionUser(session.user) : null;
  const userId = sessionUser?.id ?? null;
  const emailVerified = sessionUser?.emailVerified ?? false;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!userId || !emailVerified) {
        if (!cancelled) {
          setUserProfile(null);
          setProfileLoading(false);
        }
        return;
      }

      setProfileLoading(true);
      try {
        const profile = await getUserProfile();
        if (!cancelled) setUserProfile(profile);
      } catch (error) {
        console.error("Error loading user profile:", error);
        if (!cancelled) setUserProfile(null);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [userId, emailVerified]);

  const logout = async () => {
    await authClient.signOut();
    setUserProfile(null);
    await refetch();
  };

  const reloadUserProfile = async () => {
    if (!userId || !emailVerified) return;
    try {
      setUserProfile(await getUserProfile());
    } catch (error) {
      console.error("Error reloading user profile:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: sessionUser,
        userProfile,
        loading: isPending || profileLoading,
        logout,
        reloadUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
