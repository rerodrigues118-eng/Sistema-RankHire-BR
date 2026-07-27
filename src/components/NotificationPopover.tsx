"use client";

import React, { useState, useRef, useEffect } from "react";
import { useNotifications, AppNotification } from "@/context/NotificationContext";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  CheckCheck,
  Trash2,
  X,
  Sparkles,
  FileText,
  Bot,
  KanbanSquare,
} from "lucide-react";

export default function NotificationPopover() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "pdf-ranker":
        return <FileText className="w-3.5 h-3.5 text-blue-600" />;
      case "agente-ia":
        return <Bot className="w-3.5 h-3.5 text-indigo-600" />;
      case "pipeline":
        return <KanbanSquare className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Notificações"
        className="relative p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none"
      >
        <Bell size={18} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-[340px] max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden text-left animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Notificações
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-red-100 text-red-700 rounded-full">
                  {unreadCount} nova(s)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  title="Marcar todas como lidas"
                  className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-200/60 rounded-md transition-colors"
                >
                  <CheckCheck size={15} />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearNotifications}
                  title="Limpar histórico"
                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-md transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-100 scrollbar-hide">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs text-gray-500 font-medium">
                  Nenhuma notificação no momento.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isSuccess = notif.type === "success";
                const isError = notif.type === "error";

                return (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      !notif.read ? "bg-blue-50/40 hover:bg-blue-50/70" : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {isSuccess && (
                        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                      )}
                      {isError && (
                        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        </div>
                      )}
                      {!isSuccess && !isError && (
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                          <Info className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[13px] font-semibold text-gray-900 truncate">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {notif.timestamp}
                        </span>
                      </div>
                      <p className="text-[12px] text-gray-600 leading-snug break-words">
                        {notif.message}
                      </p>

                      {notif.category && (
                        <div className="mt-1.5 flex items-center gap-1">
                          {getCategoryIcon(notif.category)}
                          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                            {notif.category.replace("-", " ")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Unread Dot */}
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
