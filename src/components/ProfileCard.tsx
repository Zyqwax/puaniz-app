"use client";

import React, { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import type { SessionUser, UserProfile } from "@/types";

interface ProfileCardProps {
  user: SessionUser | UserProfile | any | null;
  isCollapsed?: boolean;
  onClose?: () => void;
}

export const ProfileCard = ({ user, isCollapsed = false, onClose }: ProfileCardProps) => {
  const { userProfile } = useAuth();
  const profile = userProfile || (user as UserProfile | null);
  const avatarUrl =
    profile?.avatarUrl || profile?.photoURL || (profile as any)?.image ||
    user?.avatarUrl || user?.photoURL || (user as any)?.image || null;
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => setAvatarFailed(false), [avatarUrl]);

  const displayName =
    profile?.name || user?.displayName || user?.email?.split("@")[0] || "Kullanıcı";
  const displayGrade = profile?.isSuperAdmin
    ? "Yönetici"
    : profile?.role === "principal"
      ? profile?.schoolMembership?.schoolName
        ? `Müdür • ${profile.schoolMembership.schoolName}`
        : "Okul Müdürü"
      : profile?.role === "teacher"
        ? profile?.schoolMembership?.title || "Öğretmen"
        : profile?.grade ||
          (profile?.schoolMembership?.className
            ? `${profile.schoolMembership.className} Öğrencisi`
            : "YKS Hazırlık");
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "PZ";

  return (
    <div
      className={`relative flex shrink-0 items-center gap-2 border-t border-[var(--border)] py-3 ${
        isCollapsed ? "px-3 md:flex-col md:px-0" : "px-3"
      }`}
    >
      <Link
        href="/dashboard/settings"
        onClick={() => onClose?.()}
        aria-label="Profil ve ayarlar"
        title={isCollapsed ? "Profil ve ayarlar" : undefined}
        className={`group relative flex min-w-0 items-center transition-all duration-200 ${
          isCollapsed
            ? "md:h-11 md:w-11 md:justify-center md:rounded-2xl"
            : "flex-1 gap-3 rounded-2xl p-2 hover:bg-[var(--surface-2)]"
        }`}
      >
        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#2F6BFF] text-xs font-extrabold text-white shadow-sm transition-shadow group-hover:shadow-lg group-hover:shadow-[#2F6BFF]/25">
          <span className="flex h-full w-full items-center justify-center">{initials}</span>
          {avatarUrl && !avatarFailed && (
            <Image
              src={avatarUrl}
              alt={`${displayName} profil fotoğrafı`}
              fill
              unoptimized
              onError={() => setAvatarFailed(true)}
              className="rounded-full object-cover"
            />
          )}
        </span>

        <span className={`min-w-0 flex-1 text-left ${isCollapsed ? "md:hidden" : ""}`}>
          <span className="block truncate text-[13px] font-bold leading-tight text-[var(--text)]">{displayName}</span>
          <span className="mt-0.5 block truncate text-[10px] font-medium text-[var(--text-muted)]">{displayGrade}</span>
        </span>

        <span className="absolute right-0 top-0 flex h-6 w-6 translate-x-1 -translate-y-1 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--link)] opacity-0 shadow-md transition-all duration-200 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 group-hover:shadow-lg group-hover:shadow-[var(--link)]/25 md:right-0">
          <Settings size={13} />
        </span>

        {isCollapsed && (
          <span className="pointer-events-none absolute left-full z-50 ml-3.5 hidden items-center gap-1.5 whitespace-nowrap rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-bold text-[var(--text)] shadow-xl animate-in fade-in zoom-in-95 duration-150 md:group-hover:flex">
            Profil & Ayarlar
          </span>
        )}
      </Link>

    </div>
  );
};

export default ProfileCard;
