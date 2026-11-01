"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { getDashboardNavGroups, type DashboardNavItem } from "@/lib/dashboard-navigation";
import ProfileCard from "./ProfileCard";
import PuanizLogo from "./PuanizLogo";
import { useAuth } from "@/context/AuthContext";
import type { SessionUser, UserProfile } from "@/types";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: (UserProfile | SessionUser) | null;
  isCollapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, user, isCollapsed = true }) => {
  const pathname = usePathname();
  const { userProfile } = useAuth();

  const profile = (userProfile || user) as UserProfile | null;
  const navGroups = getDashboardNavGroups(profile?.isSuperAdmin ? "admin" : profile?.role);

  const isActive = (item: DashboardNavItem) =>
    item.exact ? pathname === item.path : pathname.startsWith(item.path);

  return (
    <>
      <aside
        className={`fixed top-0 left-0 h-dvh flex flex-col z-50
          bg-[var(--surface)] border-r border-[var(--border)]
          transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
          ${isCollapsed ? "md:w-20 w-64" : "w-64"}`}
      >
        {/* ── Brand Logo Header ── */}
        <div
          className={`flex items-center h-20 shrink-0 px-4
            ${isCollapsed ? "md:justify-center md:px-0" : "justify-between"}`}
        >
          <Link
            href="/dashboard"
            className="flex items-center justify-center transition-transform hover:scale-105"
            onClick={() => onClose && onClose()}
            title="Puaniz"
          >
            {isCollapsed ? (
              <PuanizLogo variant="icon" width={38} height={38} priority />
            ) : (
              <div className="flex items-center gap-2.5">
                <PuanizLogo variant="icon" width={36} height={36} priority />
                <span className="text-xl font-black text-[var(--text)] tracking-tight">
                  puan<span className="text-[#2F6BFF]">iz</span>
                </span>
              </div>
            )}
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            aria-label="Menüyü Kapat"
            className="md:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text)] rounded-xl hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Vertical Navigation Rail ── */}
        <nav
          className={`flex-1 overflow-y-auto py-3 space-y-2.5 scrollbar-none flex flex-col
            ${isCollapsed ? "md:items-center px-3 md:px-0" : "px-3"}`}
        >
          {navGroups.map((group, index) => (
            <div key={group.label} className="w-full space-y-2">
              {index > 0 && <div role="separator" className={`mx-3 mb-3 border-t border-[var(--border)] ${isCollapsed ? "md:mx-5" : ""}`} />}
              {group.items.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => onClose && onClose()}
                className={`group relative flex items-center transition-all duration-200 cursor-pointer
                  ${
                    isCollapsed
                      ? "md:w-11 md:h-11 md:mx-auto md:justify-center md:rounded-2xl w-full px-3.5 py-3 rounded-2xl gap-3.5"
                      : "w-full px-3.5 py-3 rounded-2xl gap-3.5"
                  }
                  ${
                    active
                      ? "bg-[var(--brand)] text-white shadow-sm font-bold"
                      : "text-[var(--text-subtle)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                  }`}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.2 : 1.8}
                  className={`shrink-0 transition-transform duration-200 ${
                    active
                      ? "text-white scale-105"
                      : "text-[var(--text-subtle)] group-hover:text-[var(--text)] group-hover:scale-110"
                  }`}
                />

                <span
                  className={`font-bold text-[13px] whitespace-nowrap transition-colors
                    ${isCollapsed ? "md:hidden" : ""}`}
                >
                  {item.label}
                </span>

                {isCollapsed && (
                  <div className="hidden md:group-hover:flex absolute left-full ml-3.5 px-3 py-1.5 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border-strong)] text-xs font-bold shadow-xl whitespace-nowrap pointer-events-none z-50 items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                    <span>{item.label}</span>
                    <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-px border-4 border-transparent border-r-[var(--border-strong)]" />
                  </div>
                )}
              </Link>
            );
              })}
            </div>
          ))}
        </nav>

        {/* ── User Avatar & Profile Card ── */}
        <ProfileCard user={user} isCollapsed={isCollapsed} onClose={onClose} />
      </aside>
    </>
  );
};

export default Sidebar;
