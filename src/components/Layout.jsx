"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Layout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();

  // Route-based layout configuration
  const fluidRoutes = ["/dashboard/history", "/dashboard/community/new"];

  const isCommunityDetail =
    pathname.startsWith("/dashboard/community/") &&
    pathname !== "/dashboard/community" &&
    pathname !== "/dashboard/community/new";
  const fluid =
    fluidRoutes.includes(pathname) ||
    pathname === "/dashboard/community" ||
    isCommunityDetail;
  const fullWidth = pathname.startsWith("/dashboard/assistant");


  return (
    <div className={`${fullWidth ? "h-dvh overflow-hidden flex flex-col" : "min-h-dvh flex flex-col"} bg-[#F4F7FC]`}>
      {/* Mobile Header */}
      <div className="md:hidden flex-none flex items-center p-4 border-b border-[#0F2A5C]/[0.08] bg-white z-40">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-[#0F2A5C] hover:bg-[#F4F7FC] rounded-lg mr-4 transition-colors"
        >
          <Menu size={24} />
        </button>
        <span className="text-lg font-black text-[#0F2A5C] tracking-tight">puaniz</span>
      </div>

      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isCollapsed={true}
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
        className={`transition-all duration-300 flex flex-col md:pl-20
          ${fullWidth ? "flex-1 overflow-hidden" : "flex-1 overflow-y-auto"}`}
      >
        <div
          className={
            fullWidth ? "flex-1 flex flex-col h-full" : fluid ? "p-4 md:p-6 lg:p-8 w-full" : "p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full"
          }
        >
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
