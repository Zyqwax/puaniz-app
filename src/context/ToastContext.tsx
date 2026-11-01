"use client";

import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let bg = "bg-[var(--surface)] text-[var(--text)] border-[var(--border-strong)]";
          let icon = <Info size={18} className="text-[#2F6BFF] shrink-0" />;

          if (toast.type === "success") {
            bg = "bg-[var(--ok-bg)] text-[var(--ok)] border-[var(--ok)]/20";
            icon = <CheckCircle2 size={18} className="text-[var(--ok)] shrink-0" />;
          } else if (toast.type === "error") {
            bg = "bg-[var(--err-bg)] text-[var(--err)] border-[var(--err)]/20";
            icon = <AlertCircle size={18} className="text-[var(--err)] shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all ${bg}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {icon}
                <span className="text-xs font-semibold truncate leading-tight">
                  {toast.message}
                </span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                aria-label="Kapat"
                className="opacity-70 hover:opacity-100 p-1 cursor-pointer shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
