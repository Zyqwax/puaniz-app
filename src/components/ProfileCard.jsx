"use client";

import React, { useState, useRef, useEffect } from "react";
import { LogOut, Settings, User, ChevronDown } from "lucide-react";
import Image from "next/image";
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

  // Handle click outside to close dropdown
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
    await auth.signOut();
    router.push("/auth");
  };

  const displayName = profile?.name || user?.displayName || user?.email?.split("@")[0] || "Kullanıcı";
  const displayAvatar =
    profile?.avatarUrl ||
    user?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
  const displayGrade = profile?.grade || "";

  return (
    <div className="relative mt-auto pt-4 border-t border-white/5" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center ${isCollapsed ? "md:justify-center px-2 md:px-0" : "gap-3 px-3"} py-2 rounded-xl hover:bg-white/5 transition-all text-left group cursor-pointer`}
      >
        <div className={`relative shrink-0 ${isOpen ? "ring-2 ring-purple-500/60 ring-offset-2 ring-offset-slate-900" : ""} rounded-full transition-all duration-300`}>
          <Image
            src={displayAvatar}
            alt={displayName}
            width={36}
            height={36}
            className="rounded-full object-cover border-2 border-purple-500/40 group-hover:border-purple-400 transition-all duration-300 shrink-0"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
        </div>
        {!isCollapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate text-sm">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">{displayGrade || "Öğrenci"}</p>
            </div>
            <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </>
        )}
        {isCollapsed && (
          <div className="md:hidden flex-1 flex items-center gap-3 min-w-0 ml-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate text-sm">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">{displayGrade || "Öğrenci"}</p>
            </div>
            <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute bottom-full left-0 ${isCollapsed ? "left-14 bottom-0 w-56 ml-2" : "w-full mb-2"} bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50`}
        >
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-white/5 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
            <div className="flex items-center gap-3">
              <Image
                src={displayAvatar}
                alt={displayName}
                width={32}
                height={32}
                className="rounded-full object-cover border border-purple-500/40"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white text-sm truncate">{displayName}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="p-1.5">
            <button
              onClick={() => {
                router.push("/dashboard/settings");
                setIsOpen(false);
                if (onClose) onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-sm cursor-pointer"
            >
              <Settings size={16} />
              <span>Profil</span>
            </button>

            <div className="h-px bg-white/5 mx-2 my-1" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-sm cursor-pointer"
            >
              <LogOut size={16} />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
