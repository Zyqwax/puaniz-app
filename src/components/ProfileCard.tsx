"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  LogOut,
  Settings,
  ChevronUp,
  ExternalLink,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { getUserProfile } from "@/server/actions/profile";
import { useTheme } from "@/context/ThemeContext";
import { SessionUser, UserProfile } from "@/types";

interface ProfileCardProps {
  user: SessionUser | UserProfile | any | null;
  isCollapsed?: boolean;
  onClose?: () => void;
}

export const ProfileCard = ({ user, isCollapsed = false, onClose }: ProfileCardProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.uid) {
        const userProfile = await getUserProfile();
        setProfile(userProfile);
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await authClient.signOut();
    router.push("/auth");
    router.refresh();
  };

  const displayName =
    (profile as any)?.name || user?.displayName || user?.email?.split("@")[0] || "Öğrenci";
  const displayGrade = (profile as any)?.grade || "YKS Hazırlık";
  const initials =
    displayName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "PZ";

  return (
    <div
      className={`relative py-3 border-t border-[var(--border)] shrink-0 flex items-center
        ${isCollapsed ? "md:justify-center md:px-0 px-3" : "px-3"}`}
      ref={dropdownRef}
    >
      {isOpen && (
        <div
          className={`absolute z-50 mb-1
            ${isCollapsed ? "left-full ml-3.5 bottom-0 w-72" : "bottom-full left-0 right-0 w-full mb-3"}`}
        >
          <div className="bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#2F6BFF] text-white font-black text-sm flex items-center justify-center shadow-sm">
                    {initials}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#4ADE80] rounded-full border-2 border-[var(--surface-2)] shadow-xs" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--text)] text-sm truncate">{displayName}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{user?.email || ""}</p>
                  <div className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full bg-[var(--brand-soft)]">
                    <span className="text-[10px] text-[var(--link)] font-bold">{displayGrade}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2 space-y-1">
              <Link
                href="/dashboard/settings"
                onClick={() => {
                  setIsOpen(false);
                  onClose?.();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text)] hover:bg-[var(--surface-3)] transition-colors text-sm font-semibold group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-[var(--surface-3)] flex items-center justify-center text-[var(--link)] group-hover:bg-[var(--surface)] group-hover:shadow-sm transition-all">
                  <Settings size={16} />
                </div>
                <span>Profil & Ayarlar</span>
                <ExternalLink
                  size={12}
                  className="text-[var(--text-subtle)] ml-auto opacity-50 group-hover:opacity-100"
                />
              </Link>

              <div className="px-3 py-2 my-1 border-y border-[var(--border)]">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-subtle)] mb-2">
                  Tema
                </div>
                <div className="grid grid-cols-3 gap-1 bg-[var(--surface)] p-1 rounded-xl border border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      theme === "light"
                        ? "bg-[#2F6BFF] text-white shadow-xs"
                        : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    <Sun size={13} />
                    <span>Açık</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      theme === "dark"
                        ? "bg-[#2F6BFF] text-white shadow-xs"
                        : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    <Moon size={13} />
                    <span>Koyu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("system")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      theme === "system"
                        ? "bg-[#2F6BFF] text-white shadow-xs"
                        : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    <Laptop size={13} />
                    <span>Sistem</span>
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--err)] hover:bg-[var(--err-bg)] transition-colors text-sm font-semibold group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-[var(--err-bg)] flex items-center justify-center text-[var(--err)] transition-colors">
                  <LogOut size={16} />
                </div>
                <span>Çıkış Yap</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center cursor-pointer transition-all duration-200 group
          ${isCollapsed ? "md:w-11 md:h-11 md:justify-center md:rounded-2xl" : "w-full gap-3 p-2 rounded-2xl hover:bg-[var(--surface-2)]"}
          ${isOpen ? "bg-[var(--surface-2)]" : "bg-transparent"}`}
      >
        <div className="relative shrink-0 transition-transform duration-200 group-hover:scale-105">
          <div className="w-10 h-10 rounded-2xl bg-[#2F6BFF] text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
            {initials}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#4ADE80] rounded-full border-2 border-[var(--surface)] shadow-xs" />
        </div>

        <div className={`flex-1 min-w-0 text-left transition-all ${isCollapsed ? "md:hidden" : ""}`}>
          <p className="font-bold text-[var(--text)] text-[13px] truncate leading-tight">{displayName}</p>
          <p className="text-[10px] text-[var(--text-muted)] truncate font-medium">{displayGrade}</p>
        </div>

        <ChevronUp
          size={14}
          className={`text-[var(--text-muted)] transition-transform duration-200 shrink-0
            ${isOpen ? "rotate-0" : "rotate-180"}
            ${isCollapsed ? "md:hidden" : ""}`}
        />

        {isCollapsed && (
          <div className="hidden md:group-hover:flex absolute left-full ml-3.5 px-3 py-1.5 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border-strong)] text-xs font-bold shadow-xl whitespace-nowrap pointer-events-none z-50 items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
            <span>Profil & Ayarlar</span>
            <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-px border-4 border-transparent border-r-[var(--border-strong)]" />
          </div>
        )}
      </button>
    </div>
  );
};

export default ProfileCard;
