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

import PuanizLogo from "./PuanizLogo";

const NAV_ITEMS = [
  {
    path: "/dashboard",
    icon: LayoutDashboard,
    label: "Genel Bakış",
    exact: true,
  },
  {
    path: "/dashboard/add-exam",
    icon: PlusCircle,
    label: "Deneme Ekle",
  },
  {
    path: "/dashboard/subjects",
    icon: ClipboardList,
    label: "Konu Takip",
  },
  {
    path: "/dashboard/analysis",
    icon: PieChart,
    label: "Detaylı Analiz",
  },
  {
    path: "/dashboard/community",
    icon: Users,
    label: "Topluluk",
  },
  {
    path: "/dashboard/assistant",
    icon: Bot,
    label: "YKS Asistan",
  },
  {
    path: "/dashboard/history",
    icon: BookOpen,
    label: "Deneme Geçmişi",
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
          bg-white border-r border-[#0F2A5C]/[0.08]
          transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
          ${isCollapsed ? "md:w-20 w-64" : "w-64"}`}
      >
        {/* ── Logo ── */}
        <div
          className={`flex items-center px-4 h-20 shrink-0
            ${isCollapsed ? "md:justify-center md:px-0" : ""}`}
        >
          <Link
            href="/"
            className="flex items-center group transition-transform hover:scale-[1.03]"
            onClick={() => onClose && onClose()}
          >
            {isCollapsed ? (
              <PuanizLogo variant="icon" width={38} height={38} />
            ) : (
              <div className="flex items-center gap-2">
                <PuanizLogo variant="icon" width={36} height={36} />
                <span className="text-xl font-black text-[#0F2A5C] tracking-tight">
                  puan<span className="text-[#2F6BFF]">iz</span>
                </span>
              </div>
            )}
          </Link>

          {/* Mobile close */}
          <button
            onClick={onClose}
            className="md:hidden ml-auto p-2 text-[#4A5B7A] hover:text-[#0F2A5C] rounded-xl hover:bg-[#F4F7FC] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => onClose && onClose()}
                title={isCollapsed ? item.label : ""}
                className={`relative flex items-center gap-3.5 py-3 rounded-2xl transition-all duration-200 group
                  ${isCollapsed ? "md:justify-center md:px-0 md:py-3.5 px-3.5" : "px-3.5"}
                  ${
                    active
                      ? "bg-[#0F2A5C] text-white shadow-md shadow-[#0F2A5C]/20"
                      : "text-[#4A5B7A] hover:text-[#0F2A5C] hover:bg-[#F4F7FC]"
                  }`}
              >
                <item.icon
                  size={20}
                  className={`shrink-0 transition-colors ${
                    active ? "text-white" : "text-[#4A5B7A] group-hover:text-[#0F2A5C]"
                  }`}
                />

                <span
                  className={`font-bold text-[13px] whitespace-nowrap flex-1 transition-all duration-200
                    ${isCollapsed ? "md:hidden" : ""}`}
                >
                  {item.label}
                </span>

                {/* Badge */}
                {item.badge && !isCollapsed && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-[#FFB020] text-[#0F2A5C] tracking-wider md:inline hidden">
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
