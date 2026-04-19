"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  PieChart,
  BookOpen,
  Bot,
  X,
  Sparkles,
  Users,
  ClipboardList,
} from "lucide-react";
import ProfileCard from "./ProfileCard";

const NAV_ITEMS = [
  {
    path: "/dashboard",
    icon: LayoutDashboard,
    label: "Özet",
    exact: true,
  },
  {
    path: "/dashboard/add-exam",
    icon: PlusCircle,
    label: "Deneme Ekle",
    accent: "from-purple-500 to-violet-500",
  },
  {
    path: "/dashboard/subjects",
    icon: ClipboardList,
    label: "Konu Takip",
  },
  {
    path: "/dashboard/analysis",
    icon: PieChart,
    label: "Analizler",
  },
  {
    path: "/dashboard/community",
    icon: Users,
    label: "Topluluk",
  },
  {
    path: "/dashboard/assistant",
    icon: Bot,
    label: "YZ Asistan",
    badge: "AI",
  },
  {
    path: "/dashboard/history",
    icon: BookOpen,
    label: "Geçmiş",
  },
  {
    path: "/dashboard/changelog",
    icon: Sparkles,
    label: "Yenilikler",
  },
];

const Sidebar = ({ isOpen, onClose, user, isCollapsed }) => {
  const pathname = usePathname();

  const isActive = (item) =>
    item.exact ? pathname === item.path : pathname.startsWith(item.path);

  return (
    <>
      <div
        className={`fixed top-0 left-0 h-dvh flex flex-col z-50
          bg-slate-950/95 backdrop-blur-xl border-r border-white/5
          transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
          ${isCollapsed ? "md:w-20 w-64" : "w-64"}`}
      >
        {/* ── Logo ── */}
        <div
          className={`flex items-center px-4 h-16 border-b border-white/5 shrink-0
            ${isCollapsed ? "md:justify-center md:px-0" : ""}`}
        >
          <Link
            href="/"
            className="flex items-center gap-3 group"
            onClick={() => onClose && onClose()}
          >
            {/* Logo mark */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-black text-white text-base shadow-lg shadow-purple-900/30 group-hover:shadow-purple-900/50 transition-all duration-300 group-hover:scale-105">
                P
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 shadow" />
            </div>

            {/* Logo text — hidden in collapsed desktop mode */}
            <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? "md:hidden" : ""}`}>
              <span className="font-black text-lg text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 whitespace-nowrap leading-none block">
                PuanIz
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                YKS Takip
              </span>
            </div>
          </Link>

          {/* Mobile close */}
          <button
            onClick={onClose}
            className="md:hidden ml-auto p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => onClose && onClose()}
                title={isCollapsed ? item.label : ""}
                className={`relative flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 group
                  ${isCollapsed ? "md:justify-center md:px-0 md:py-3 px-3" : "px-3"}
                  ${
                    active
                      ? "bg-purple-600/20 text-white border border-purple-500/30 shadow-sm shadow-purple-900/20"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
              >
                {/* Active left accent */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-purple-400 to-pink-500 rounded-r-full" />
                )}

                <item.icon
                  size={19}
                  className={`shrink-0 transition-colors ${
                    active ? "text-purple-400" : "text-slate-500 group-hover:text-slate-300"
                  }`}
                />

                <span
                  className={`font-semibold text-[13px] whitespace-nowrap flex-1 transition-all duration-200
                    ${isCollapsed ? "md:hidden" : ""}`}
                >
                  {item.label}
                </span>

                {/* Badge */}
                {item.badge && !isCollapsed && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-gradient-to-r from-purple-500 to-pink-500 text-white tracking-wider md:inline hidden">
                    {item.badge}
                  </span>
                )}
                {item.badge && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md bg-gradient-to-r from-purple-500 to-pink-500 text-white tracking-wider md:hidden`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Profile Card ── */}
        <ProfileCard user={user} isCollapsed={isCollapsed} onClose={onClose} />
      </div>
    </>
  );
};

export default Sidebar;
