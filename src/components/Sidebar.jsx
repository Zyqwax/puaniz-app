"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  PieChart,
  LogOut,
  BookOpen,
  Bot,
  X,
  Sparkles,
  Users,
  Shield,
  ClipboardList,
} from "lucide-react";

import ProfileCard from "./ProfileCard";

const Sidebar = ({ isOpen, onClose, user, isCollapsed }) => {
  const pathname = usePathname();

  const baseNavItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Özet" },
    { path: "/dashboard/add-exam", icon: PlusCircle, label: "Deneme Ekle" },
    { path: "/dashboard/subjects", icon: ClipboardList, label: "Konu Takip" },
    { path: "/dashboard/analysis", icon: PieChart, label: "Analizler" },
    { path: "/dashboard/community", icon: Users, label: "Soru-Cevap" },
    { path: "/dashboard/assistant", icon: Bot, label: "Asistana Sor" },
    { path: "/dashboard/history", icon: BookOpen, label: "Geçmiş" },
    { path: "/dashboard/changelog", icon: Sparkles, label: "Yenilikler" },
  ];

  // Add navigation items
  const navItems = baseNavItems;

  return (
    <>
      <div
        className={`fixed top-0 left-0 h-dvh glass-panel border-r border-white/10 flex flex-col p-4 transition-all duration-300 z-50 
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
          ${isCollapsed ? "md:w-20 w-64" : "w-64"}`}
      >
        <div className={`flex items-center ${isCollapsed ? "md:justify-center justify-between" : "justify-between"} mb-10 px-2 mt-2`}>
          <Link 
            href="/" 
            className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shrink-0 group-hover:scale-105 transition-transform">
              Y
            </div>
            {!isCollapsed && (
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent whitespace-nowrap">
                YKS Takip
              </h1>
            )}
            {isCollapsed && (
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent whitespace-nowrap md:hidden">
                YKS Takip
              </h1>
            )}
          </Link>

          <button
            onClick={onClose}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 ml-auto"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => onClose && onClose()}
                title={isCollapsed ? item.label : ""}
                className={`flex items-center ${isCollapsed ? "md:justify-center px-4 md:px-2 gap-3 md:gap-0" : "gap-3 px-4"} py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-purple-600 shadow-lg shadow-purple-900/20 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon size={20} className="shrink-0" />
                {isCollapsed ? (
                  <span className="font-medium whitespace-nowrap md:hidden ml-3">{item.label}</span>
                ) : (
                  <span className="font-medium whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <ProfileCard user={user} isCollapsed={isCollapsed} onClose={onClose} />
      </div>
    </>
  );
};

export default Sidebar;
