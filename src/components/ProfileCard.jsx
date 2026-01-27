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
    <div className="relative mt-auto" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"} py-3 rounded-xl hover:bg-white/5 transition-all text-left border border-transparent hover:border-white/10 group cursor-pointer`}
      >
        <Image
          src={displayAvatar}
          alt={displayName}
          width={40}
          height={40}
          className="rounded-full object-cover border-2 border-purple-500/30 group-hover:border-purple-500 transition-colors shrink-0"
        />
        {!isCollapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate text-sm">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">{displayGrade || "Öğrenci"}</p>
            </div>
            <ChevronDown size={16} className={`text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute bottom-full left-0 ${isCollapsed ? "left-12 bottom-0 w-48 ml-2" : "w-full mb-2"} bg-gray-800 border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in ${isCollapsed ? "slide-in-from-left-2" : "slide-in-from-bottom-2"} duration-200 z-50`}
        >
          <div className="p-1">
            <button
              onClick={() => {
                router.push("/settings");
                setIsOpen(false);
                if (onClose) onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-sm cursor-pointer"
            >
              <Settings size={16} />
              <span>Ayarlar</span>
            </button>

            <div className="h-px bg-white/5 my-1" />

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
