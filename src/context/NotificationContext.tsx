"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X, Bell, Trash2, CheckCheck } from "lucide-react";

export interface AppNotification {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category?: "pdf-ranker" | "agente-ia" | "pipeline" | "vagas" | "sistema";
}

export interface ToastPopup {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message: string;
  exiting?: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  toasts: ToastPopup[];
  addNotification: (notif: {
    type: "success" | "error" | "info";
    title: string;
    message: string;
    category?: "pdf-ranker" | "agente-ia" | "pipeline" | "vagas" | "sistema";
  }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  dismissToast: (id: string) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY_NOTIFS = "rankhire_app_notifications_v1";
const STORAGE_KEY_SIDEBAR = "rankhire_sidebar_collapsed";

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-init-1",
    type: "success",
    title: "Agente IA Ativo",
    message: "O Agente de IA está pronto para triar currículos automaticamente.",
    timestamp: "Hoje, 09:00",
    read: false,
    category: "agente-ia",
  },
  {
    id: "notif-init-2",
    type: "info",
    title: "Sistema Conectado",
    message: "Triagem via PDF Ranker pronta para processar novas vagas.",
    timestamp: "Hoje, 08:30",
    read: true,
    category: "pdf-ranker",
  },
];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<ToastPopup[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedNotifs = localStorage.getItem(STORAGE_KEY_NOTIFS);
      if (savedNotifs) {
        setNotifications(JSON.parse(savedNotifs));
      } else {
        setNotifications(DEFAULT_NOTIFICATIONS);
      }

      const savedSidebar = localStorage.getItem(STORAGE_KEY_SIDEBAR);
      if (savedSidebar !== null) {
        setIsSidebarCollapsed(savedSidebar === "true");
      }
    } catch {
      setNotifications(DEFAULT_NOTIFICATIONS);
    }
    setIsLoaded(true);
  }, []);

  // Save notifications to localStorage when modified
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
    } catch {
      /* ignore */
    }
  }, [notifications, isLoaded]);

  // Save sidebar collapsed state
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY_SIDEBAR, String(isSidebarCollapsed));
    } catch {
      /* ignore */
    }
  }, [isSidebarCollapsed, isLoaded]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }, []);

  const addNotification = useCallback(
    ({
      type,
      title,
      message,
      category = "sistema",
    }: {
      type: "success" | "error" | "info";
      title: string;
      message: string;
      category?: "pdf-ranker" | "agente-ia" | "pipeline" | "vagas" | "sistema";
    }) => {
      const now = new Date();
      const timeStr = `Hoje, ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

      const newNotif: AppNotification = {
        id,
        type,
        title,
        message,
        timestamp: timeStr,
        read: false,
        category,
      };

      setNotifications((prev) => [newNotif, ...prev]);

      // Add to toasts
      const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const newToast: ToastPopup = {
        id: toastId,
        type,
        title,
        message,
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss toast after 5s
      setTimeout(() => {
        dismissToast(toastId);
      }, 5000);
    },
    [dismissToast]
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        dismissToast,
        isSidebarCollapsed,
        toggleSidebar,
        setSidebarCollapsed,
      }}
    >
      {children}

      {/* Floating Toast Popups Container - Bottom Right */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-xl p-4 shadow-xl border backdrop-blur-md transition-all duration-300 ${
                toast.exiting ? "toast-exit" : "toast-enter"
              } ${
                isSuccess
                  ? "bg-[#ECFDF5]/95 border-[#A7F3D0] text-[#065F46] shadow-emerald-500/10"
                  : isError
                  ? "bg-[#FEF2F2]/95 border-[#FECACA] text-[#991B1B] shadow-red-500/10"
                  : "bg-[#EFF6FF]/95 border-[#BFDBFE] text-[#1E40AF] shadow-blue-500/10"
              }`}
            >
              <div className="flex items-start gap-3">
                {isSuccess && (
                  <div className="w-8 h-8 rounded-full bg-[#10B981]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-[#059669]" />
                  </div>
                )}
                {isError && (
                  <div className="w-8 h-8 rounded-full bg-[#EF4444]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertCircle className="w-5 h-5 text-[#DC2626]" />
                  </div>
                )}
                {!isSuccess && !isError && (
                  <div className="w-8 h-8 rounded-full bg-[#3B82F6]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Info className="w-5 h-5 text-[#2563EB]" />
                  </div>
                )}

                <div className="flex-1 min-w-0 pr-1">
                  <h4 className="text-[14px] font-semibold leading-tight">
                    {toast.title}
                  </h4>
                  <p className="text-[12px] opacity-90 mt-1 leading-snug">
                    {toast.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="text-current opacity-50 hover:opacity-100 transition-opacity p-1 rounded-md -mr-1 -mt-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
