"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from "framer-motion";
import type { PageId } from "@/lib/types";
import { PAGE_HREFS } from "@/lib/routes";
import {
  LayoutDashboard,
  FileText,
  KanbanSquare,
  BarChart3,
  Settings,
  Briefcase,
  Search,
  Bot,
  Users,
  Search as SearchIcon,
  LogOut,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { clearCachedProfile, getCachedProfile, setCachedProfile } from "@/lib/profile-cache";
import { getPlanoBadge } from "@/lib/plano-access";
import { useNotifications } from "@/context/NotificationContext";
import NotificationPopover from "@/components/NotificationPopover";

interface SidebarProps {
  activePage?: PageId;
  onNavigate?: (page: PageId) => void;
}

const NAV_SECTIONS = [
  {
    label: "Principal",
    items: [
      { id: "dashboard" as PageId, icon: LayoutDashboard, label: "Dashboard" },
      { id: "vagas" as PageId, icon: Briefcase, label: "Vagas" },
    ],
  },
  {
    label: "Buscar Candidatos",
    items: [
      { id: "linkedin" as PageId, icon: Search, label: "Busca Inteligente" },
      { id: "agente-ia" as PageId, icon: Bot, label: "Agente IA" },
      { id: "pdf-ranker" as PageId, icon: FileText, label: "PDF Ranker" },
    ],
  },
  {
    label: "Gerenciar",
    items: [
      { id: "candidatos" as PageId, icon: Users, label: "Candidatos (CRM)" },
      { id: "pipeline" as PageId, icon: KanbanSquare, label: "Pipeline" },
    ],
  },
  {
    label: "Conta",
    items: [
      { id: "analytics" as PageId, icon: BarChart3, label: "Analytics" },
      { id: "settings" as PageId, icon: Settings, label: "Configurações" },
    ],
  },
];

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { isSidebarCollapsed, toggleSidebar } = useNotifications();
  const pathname = usePathname();
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string>("Carregando...");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [planoBadge, setPlanoBadge] = useState<{ label: string; color: string }>({ label: "TRIAL", color: "gray" });
  const [isTrial, setIsTrial] = useState(false);

  // Helper for strict route active matching
  const getIsActive = (itemId: PageId) => {
    if (itemId === "dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    if (itemId === "vagas") {
      return pathname?.startsWith("/vagas");
    }
    if (itemId === "linkedin") {
      return pathname?.startsWith("/busca-inteligente");
    }
    if (itemId === "agente-ia") {
      return pathname?.startsWith("/agente-ia") || pathname?.startsWith("/agentes");
    }
    if (itemId === "pdf-ranker") {
      return pathname?.startsWith("/pdf-ranker");
    }
    if (itemId === "candidatos") {
      return pathname?.startsWith("/candidatos");
    }
    if (itemId === "pipeline") {
      return pathname?.startsWith("/pipeline");
    }
    if (itemId === "analytics") {
      return pathname?.startsWith("/analytics");
    }
    if (itemId === "settings") {
      return pathname?.startsWith("/configuracoes");
    }
    return activePage === itemId;
  };

  useEffect(() => {
    async function checkRole() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const localEmail = String(user?.email || "").trim().toLowerCase();
        if (localEmail) {
          setUserEmail(user?.email || "Usuário");
          const userObj = user as unknown as Record<string, unknown> | undefined;
          const metaName = (userObj?.user_metadata as Record<string, unknown> | undefined)?.full_name || (userObj?.user_metadata as Record<string, unknown> | undefined)?.name || null;
          if (metaName) setDisplayName(metaName as string);
        }

        const res = await fetch('/api/me/role', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUserEmail(data.email || "Usuário");
          try {
            const cached = getCachedProfile();
            if (cached) {
              setAvatarUrl(cached.avatar_url || null);
              setDisplayName(cached.nome || cached.email || null);
            }
          } catch {
            /* ignore */
          }

          try {
            const p = await fetch('/api/profile', { credentials: 'include', cache: 'no-store' });
            if (p.ok) {
              const pd = await p.json();
              setAvatarUrl(pd.profile?.avatar_url || null);
              setDisplayName(pd.profile?.nome || pd.profile?.email || null);
              try { setCachedProfile(pd.profile); } catch {}
            }
          } catch {
            /* ignore */
          }
        }

        try {
          const empresaRes = await fetch('/api/empresas', { credentials: 'include' });
          if (empresaRes.ok) {
            const empresaData = await empresaRes.json();
            const badge = getPlanoBadge(empresaData.empresa || {});
            setPlanoBadge(badge);
            const plano = (empresaData.empresa?.plano || 'trial').toLowerCase();
            const subStatus = empresaData.empresa?.subscription_status || '';
            const isAdmin = ['admin', 'superadmin'].includes((empresaData.empresa?.role || '').toLowerCase());
            const isTrialPlan = plano === 'trial' || plano === 'trial_starter';
            setIsTrial(isTrialPlan && !isAdmin && subStatus !== 'active');
          }
        } catch {
          /* ignore */
        }
      } catch {
        /* role check failed */
      }
    }
    checkRole();
    const onProfileUpdated = (e: Event) => {
      try {
        const profile = (e as CustomEvent).detail;
        if (profile) {
          setAvatarUrl(profile.avatar_url || null);
          setDisplayName(profile.nome || profile.email || null);
          setUserEmail((prev) => profile.email || prev);
          try { setCachedProfile(profile); } catch {}
        }
      } catch {}
    };
    window.addEventListener('profile-updated', onProfileUpdated as EventListener);
    return () => window.removeEventListener('profile-updated', onProfileUpdated as EventListener);
  }, []);

  const handleLogout = async () => {
    clearCachedProfile();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isSidebarCollapsed ? "80px" : "256px",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        background: "var(--bg-sidebar, #ffffff)",
        borderRight: "1px solid var(--border-sidebar, #e5e7eb)",
      }}
      className="flex flex-col h-screen select-none relative z-30 font-sans flex-shrink-0 overflow-hidden"
    >
      {/* Header / Logo + Bell + Collapse Toggle */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
        {!isSidebarCollapsed ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0 shadow-xs">
                <span className="text-white font-bold text-sm tracking-tight">R.</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-slate-900 leading-tight truncate">
                  RankHire BR
                </span>
                <span className="text-[10px] text-slate-400 font-medium truncate">
                  recrutamento IA
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <NotificationPopover />
              <button
                type="button"
                onClick={toggleSidebar}
                title="Recolher menu lateral"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <PanelLeftClose size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={toggleSidebar}
              title="Expandir menu lateral"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            >
              <PanelLeftOpen size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Busca rápida */}
      {!isSidebarCollapsed && (
        <div className="px-3 my-3 flex-shrink-0">
          <button className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition rounded-lg px-3 py-2 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <SearchIcon size={14} className="text-slate-400" />
              <span>Busca rápida</span>
            </div>
            <span className="border border-slate-200 bg-white rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
              ⌘K
            </span>
          </button>
        </div>
      )}

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide py-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-3 last:mb-0">
            {!isSidebarCollapsed && (
              <span className="block px-4 pb-1.5 pt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {section.label}
              </span>
            )}
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = getIsActive(item.id);
                const isLocked = isTrial && (item.id === "candidatos" || item.id === "agente-ia");
                const href = isLocked ? "/dashboard" : PAGE_HREFS[item.id] ?? "/dashboard";

                if (isSidebarCollapsed) {
                  return (
                    <li key={item.id} className="w-full flex justify-center py-1">
                      <Link
                        href={href}
                        onClick={(e) => {
                          if (isLocked) e.preventDefault();
                          if (onNavigate) onNavigate(item.id);
                        }}
                        title={isLocked ? `${item.label} — disponível nos planos pagos` : item.label}
                        className={`p-2.5 rounded-xl transition relative flex items-center justify-center ${
                          isActive
                            ? "bg-emerald-50 text-emerald-600 font-semibold"
                            : isLocked
                            ? "text-slate-300 opacity-60"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                        {isLocked && <Lock size={10} className="absolute top-1 right-1 text-amber-500" />}
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={item.id} className="w-full px-2">
                    <Link
                      href={href}
                      onClick={(e) => {
                        if (isLocked) e.preventDefault();
                        if (onNavigate) onNavigate(item.id);
                      }}
                      title={isLocked ? `${item.label} — disponível nos planos pagos` : item.label}
                      className={`flex items-center gap-3 w-full text-left transition rounded-xl text-xs py-2.5 px-3 font-medium ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 font-bold border-l-3 border-emerald-500"
                          : isLocked
                          ? "text-slate-400 opacity-70 hover:bg-slate-50"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Icon size={17} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-emerald-600" : "text-slate-400"} />
                      <span className="truncate flex-1">{item.label}</span>
                      {isLocked && <Lock size={12} className="flex-shrink-0 text-amber-500 ml-auto" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-100 flex-shrink-0 bg-slate-50/50">
        {!isSidebarCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-slate-200">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="avatar"
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    {(displayName || userEmail || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex flex-col">
                <span
                  className="text-xs font-bold text-slate-800 truncate leading-tight"
                  title={displayName || userEmail}
                >
                  {displayName || userEmail}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                    {planoBadge.label}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-600 transition p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-slate-200">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="avatar"
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  {(displayName || userEmail || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-600 transition p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
