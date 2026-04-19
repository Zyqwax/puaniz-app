"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  LogOut,
  Settings,
  ChevronUp,
  ExternalLink,
  Shield,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import { getUserProfile } from "../services/userService";

const ProfileCard = ({ user, isCollapsed, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const dropdownRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.uid) {
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await auth.signOut();
    router.push("/auth");
  };

  const displayName =
    profile?.name || user?.displayName || user?.email?.split("@")[0] || "Kullanıcı";
  const displayAvatar =
    profile?.avatarUrl ||
    user?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=7c3aed&color=fff&bold=true`;
  const displayGrade = profile?.grade || "Öğrenci";
  const initial = displayName[0]?.toUpperCase() || "?";

  return (
    <div className="relative px-3 pb-4 pt-2 border-t border-white/5 shrink-0" ref={dropdownRef}>
      {/* ── Dropdown (opens upward) ── */}
      {isOpen && (
        <div
          className={`absolute bottom-full z-50 mb-2
            ${isCollapsed ? "left-14 w-60" : "left-0 right-0 w-full"}`}
        >
          <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
            {/* User info header */}
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <Image
                    src={displayAvatar}
                    alt={displayName}
                    width={44}
                    height={44}
                    className="rounded-xl object-cover border-2 border-purple-500/30"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{displayName}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20">
                    <Shield size={9} className="text-purple-400" />
                    <span className="text-[10px] text-purple-300 font-bold">{displayGrade}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-2 space-y-0.5">
              <Link
                href="/dashboard/settings"
                onClick={() => { setIsOpen(false); onClose?.(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-sm font-medium group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center group-hover:bg-purple-500/10 group-hover:border-purple-500/20 transition-colors">
                  <Settings size={14} className="text-slate-400 group-hover:text-purple-400 transition-colors" />
                </div>
                <span>Profil & Ayarlar</span>
                <ExternalLink size={12} className="text-slate-600 ml-auto" />
              </Link>

              <div className="h-px bg-white/5 mx-1 my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-sm font-medium group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center group-hover:bg-red-500/10 group-hover:border-red-500/20 transition-colors">
                  <LogOut size={14} className="text-slate-400 group-hover:text-red-400 transition-colors" />
                </div>
                <span>Çıkış Yap</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Trigger Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 p-2 rounded-xl cursor-pointer
          hover:bg-white/5 border transition-all duration-200 group
          ${isOpen
            ? "bg-white/5 border-white/10"
            : "border-transparent hover:border-white/5"
          }
          ${isCollapsed ? "md:justify-center md:px-0 md:py-3" : ""}`}
      >
        {/* Avatar */}
        <div className={`relative shrink-0 ${isOpen ? "ring-2 ring-purple-500/50 ring-offset-2 ring-offset-slate-950 rounded-xl" : ""} transition-all`}>
          <Image
            src={displayAvatar}
            alt={displayName}
            width={34}
            height={34}
            className="rounded-xl object-cover border border-purple-500/20 group-hover:border-purple-400/40 transition-all"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950" />
        </div>

        {/* Name + grade (collapsed: hidden on desktop, visible on mobile) */}
        <div className={`flex-1 min-w-0 text-left transition-all ${isCollapsed ? "md:hidden" : ""}`}>
          <p className="font-bold text-white text-[13px] truncate leading-tight">{displayName}</p>
          <p className="text-[10px] text-slate-500 truncate">{displayGrade}</p>
        </div>

        {/* Chevron */}
        <ChevronUp
          size={14}
          className={`text-slate-600 transition-transform duration-200 shrink-0
            ${isOpen ? "rotate-0" : "rotate-180"}
            ${isCollapsed ? "md:hidden" : ""}`}
        />
      </button>
    </div>
  );
};

export default ProfileCard;
