"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Layout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();

  // Route-based layout configuration
  const fluidRoutes = ["/dashboard/history"];

  const isCommunityDetail = pathname.startsWith("/dashboard/community/") && pathname !== "/dashboard/community";
  const fluid = fluidRoutes.includes(pathname) || pathname === "/dashboard/community";
  const fullWidth = ["/dashboard/assistant"].includes(pathname) || isCommunityDetail;

  return (
    <div className={`${fullWidth ? "h-screen overflow-hidden flex flex-col" : "min-h-screen"} bg-slate-900`}>
      {/* Mobile Header */}
      <div className="md:hidden flex-none flex items-center p-4 border-b border-white/10 bg-slate-900 z-40">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 mr-4"
        >
          <Menu size={24} />
        </button>
        <span className="text-lg font-bold text-white">YKS Takip</span>
      </div>

      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(!isCollapsed)}
        user={user}
      />

      {/* Backdrop for mobile sidebar */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main
        className={`transition-all duration-300 flex flex-col 
          ${isCollapsed ? "md:pl-20" : "md:pl-64"}
          ${fullWidth ? "flex-1 overflow-hidden" : "min-h-screen"}`}
      >
        <div
          className={
            fullWidth ? "flex-1 flex flex-col h-full" : fluid ? "p-4 md:p-8 w-full" : "p-4 md:p-8 max-w-7xl mx-auto"
          }
        >
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
