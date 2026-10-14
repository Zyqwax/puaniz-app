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
    profile?.name || user?.displayName || user?.email?.split("@")[0] || "Enes Samed Gözlü";
  const displayGrade = profile?.grade || "12. Sınıf - SAY";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "ES";

  return (
    <div className="relative px-3 pb-4 pt-2 border-t border-[#0F2A5C]/[0.08] shrink-0" ref={dropdownRef}>
      {/* ── Dropdown (opens upward) ── */}
      {isOpen && (
        <div
          className={`absolute bottom-full z-50 mb-3
            ${isCollapsed ? "left-14 w-64" : "left-0 right-0 w-full"}`}
        >
          <div className="bg-white border border-[#0F2A5C]/10 rounded-2xl shadow-xl shadow-[#0F2A5C]/10 overflow-hidden">
            {/* User info header */}
            <div className="p-4 border-b border-[#0F2A5C]/[0.06]">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#2F6BFF] text-white font-black text-sm flex items-center justify-center shadow-sm">
                    {initials}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#0F2A5C] text-sm truncate">{displayName}</p>
                  <p className="text-xs text-[#4A5B7A] truncate">{user?.email || "enessamed422@gmail.com"}</p>
                  <div className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full bg-[#2F6BFF]/10">
                    <span className="text-[10px] text-[#2F6BFF] font-bold">{displayGrade}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-2 space-y-1">
              <Link
                href="/dashboard/settings"
                onClick={() => { setIsOpen(false); onClose?.(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#0F2A5C] hover:bg-[#F4F7FC] transition-colors text-sm font-semibold group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-[#F4F7FC] flex items-center justify-center text-[#2F6BFF] group-hover:bg-white group-hover:shadow-sm transition-all">
                  <Settings size={16} />
                </div>
                <span>Profil & Ayarlar</span>
                <ExternalLink size={12} className="text-[#4A5B7A] ml-auto opacity-40 group-hover:opacity-100" />
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-sm font-semibold group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 transition-colors">
                  <LogOut size={16} />
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
        className={`w-full flex items-center gap-3 p-2 rounded-2xl cursor-pointer
          hover:bg-[#F4F7FC] transition-all duration-200 group
          ${isOpen ? "bg-[#F4F7FC]" : "bg-transparent"}
          ${isCollapsed ? "md:justify-center md:px-0 md:py-2.5" : ""}`}
      >
        {/* Avatar matching PDF (Rounded Blue Box with white ES initials) */}
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#2F6BFF] text-white font-black text-xs flex items-center justify-center shadow-sm">
            {initials}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-xs" />
        </div>

        {/* Name + grade (collapsed: hidden on desktop, visible on mobile) */}
        <div className={`flex-1 min-w-0 text-left transition-all ${isCollapsed ? "md:hidden" : ""}`}>
          <p className="font-bold text-[#0F2A5C] text-[13px] truncate leading-tight">{displayName}</p>
          <p className="text-[10px] text-[#4A5B7A] truncate font-medium">{displayGrade}</p>
        </div>

        {/* Chevron */}
        <ChevronUp
          size={14}
          className={`text-[#4A5B7A] transition-transform duration-200 shrink-0
            ${isOpen ? "rotate-0" : "rotate-180"}
            ${isCollapsed ? "md:hidden" : ""}`}
        />
      </button>
    </div>
  );
};

export default ProfileCard;
