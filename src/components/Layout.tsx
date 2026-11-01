"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";
import { Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DashboardHeaderActionsContext } from "@/components/dashboard/DashboardHeaderActionsContext";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [headerActionsElement, setHeaderActionsElement] = useState<HTMLDivElement | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, userProfile } = useAuth();
  const pathname = usePathname();

  // Route-based layout configuration
  const fluidRoutes = ["/dashboard/community/new", "/dashboard/changelog"];

  const isCommunityDetail =
    pathname.startsWith("/dashboard/community/") &&
    pathname !== "/dashboard/community" &&
    pathname !== "/dashboard/community/new";
  const fluid =
    fluidRoutes.includes(pathname) ||
    pathname === "/dashboard/community" ||
    isCommunityDetail;
  const fullWidth = pathname.startsWith("/dashboard/assistant");
  const splitCommunity = pathname === "/dashboard/community";

  return (
    <div
      className={`${
        fullWidth ? "h-dvh overflow-hidden flex flex-col" : `min-h-dvh flex flex-col ${splitCommunity ? "lg:h-dvh lg:overflow-hidden" : ""}`
      } bg-[var(--bg)]`}
    >
      {/* Mobile Header */}
      <div className="md:hidden flex-none flex items-center p-4 border-b border-[var(--border)] bg-[var(--surface)] z-40">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Menüyü Aç"
          className="p-2 text-[var(--text)] hover:bg-[var(--surface-2)] rounded-lg mr-4 transition-colors cursor-pointer"
        >
          <Menu size={24} />
        </button>
        <span className="text-lg font-black text-[var(--text)] tracking-tight">
          puan<span className="text-[#2F6BFF]">iz</span>
        </span>
      </div>

      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isCollapsed={true}
        user={userProfile || user}
      />

      {/* Backdrop for mobile sidebar */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <DashboardHeaderActionsContext.Provider value={headerActionsElement}>
        <main
          className={`transition-all duration-300 flex flex-col md:pl-20 ${
            fullWidth ? "flex-1 overflow-hidden" : `flex-1 overflow-y-auto pb-16 md:pb-0 ${splitCommunity ? "lg:min-h-0 lg:overflow-hidden" : ""}`
          }`}
        >
          <DashboardPageHeader pathname={pathname} actionsRef={setHeaderActionsElement} />
          <div
            className={
              fullWidth
                ? "flex-1 min-h-0 flex flex-col"
                : fluid
                ? `p-4 md:p-6 lg:p-8 w-full ${splitCommunity ? "lg:min-h-0 lg:flex-1 lg:overflow-hidden" : ""}`
                : "p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full"
            }
          >
            {children}
          </div>
        </main>
      </DashboardHeaderActionsContext.Provider>

      {/* Mobile persistent bottom navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
