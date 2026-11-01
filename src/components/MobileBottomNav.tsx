"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getDashboardNavGroups } from "@/lib/dashboard-navigation";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { userProfile } = useAuth();

  // Do not render on public landing or auth
  if (!pathname.startsWith("/dashboard")) {
    return null;
  }

  const groups = getDashboardNavGroups(userProfile?.isSuperAdmin ? "admin" : userProfile?.role);
  const items = [...groups[0].items.slice(0, 3), ...groups[1].items.filter((item) => item.path.endsWith("community") || item.path.endsWith("settings"))];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--border)] px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
                (item.exact ? pathname === item.path : pathname.startsWith(item.path))
                  ? "text-[#2F6BFF] font-bold"
                  : "text-[var(--text-subtle)] hover:text-[var(--text)] font-medium"
              }`}
            >
              <Icon size={20} className={(item.exact ? pathname === item.path : pathname.startsWith(item.path)) ? "stroke-[2.5]" : "stroke-[1.8]"} />
              <span className="text-[10px] leading-tight tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
