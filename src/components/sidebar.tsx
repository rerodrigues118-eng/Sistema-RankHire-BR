"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from "framer-motion";
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
  ChevronDown,
  UserCircle,
  CreditCard,
  Zap,
  Moon,
  Sun,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { clearCachedProfile, getCachedProfile, setCachedProfile } from "@/lib/profile-cache";
import { getPlanoBadge } from "@/lib/plano-access";
import { useNotifications } from "@/context/NotificationContext";
import { useTheme } from "@/context/ThemeContext";
import NotificationPopover from "@/components/NotificationPopover";

interface SidebarProps {
  activePage?: PageId;
  onNavigate?: (page: PageId) => void;
}

// Nav items without Settings — handled separately with submenu
const NAV_SECTIONS = [
  {
    label: "PRINCIPAL",
    items: [
      { id: "dashboard" as PageId, icon: LayoutDashboard, label: "Dashboard" },
      { id: "vagas" as PageId, icon: Briefcase, label: "Vagas" },
    ],
  },
  {
    label: "BUSCAR CANDIDATOS",
    items: [
      { id: "linkedin" as PageId, icon: Search, label: "Busca Inteligente" },
      { id: "agente-ia" as PageId, icon: Bot, label: "Agente IA" },
      { id: "pdf-ranker" as PageId, icon: FileText, label: "PDF Ranker" },
    ],
  },
  {
    label: "GERENCIAR",
    items: [
      { id: "candidatos" as PageId, icon: Users, label: "Candidatos (CRM)" },
      { id: "pipeline" as PageId, icon: KanbanSquare, label: "Pipeline" },
    ],
  },
  {
    label: "CONTA",
    items: [
      { id: "analytics" as PageId, icon: BarChart3, label: "Analytics" },
    ],
  },
];

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { isSidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  // Minimizar a sidebar quando o evento customizado 'collapse-sidebar' for disparado
  useEffect(() => {
    const handleCollapse = () => setSidebarCollapsed(true);
    window.addEventListener("collapse-sidebar", handleCollapse);
    return () => window.removeEventListener("collapse-sidebar", handleCollapse);
  }, [setSidebarCollapsed]);

  const [userEmail, setUserEmail] = useState<string>("Carregando...");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [planoBadge, setPlanoBadge] = useState<{ label: string; color: string }>({ label: "TRIAL", color: "gray" });
  const [isTrial, setIsTrial] = useState(false);

  // Settings submenu open state
  const [isSettingsOpen, setIsSettingsOpen] = useState(() =>
    pathname?.startsWith("/configuracoes") ?? false
  );

  // Sync submenu open state with pathname
  useEffect(() => {
    if (pathname?.startsWith("/configuracoes")) {
      setIsSettingsOpen(true);
    }
  }, [pathname]);

  const isSettingsActive = pathname?.startsWith("/configuracoes");

  // Strict route matching using usePathname
  const getIsActive = (itemId: PageId) => {
    if (itemId === "dashboard") return pathname === "/dashboard" || pathname === "/";
    if (itemId === "vagas") return pathname?.startsWith("/vagas");
    if (itemId === "linkedin") return pathname?.startsWith("/busca-inteligente");
    if (itemId === "agente-ia") return pathname?.startsWith("/agente-ia") || pathname?.startsWith("/agentes");
    if (itemId === "pdf-ranker") return pathname?.startsWith("/pdf-ranker");
    if (itemId === "candidatos") return pathname?.startsWith("/candidatos");
    if (itemId === "pipeline") return pathname?.startsWith("/pipeline");
    if (itemId === "analytics") return pathname?.startsWith("/analytics");
    return activePage === itemId;
  };

  useEffect(() => {
    async function checkRole() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const localEmail = String(user?.email || "").trim().toLowerCase();
        if (localEmail) {
          setUserEmail(user?.email || "Usuário");
          const userObj = user as unknown as Record<string, unknown> | undefined;
          const metaName =
            (userObj?.user_metadata as Record<string, unknown> | undefined)?.full_name ||
            (userObj?.user_metadata as Record<string, unknown> | undefined)?.name || null;
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
          } catch { /* ignore */ }

          try {
            const p = await fetch('/api/profile', { credentials: 'include', cache: 'no-store' });
            if (p.ok) {
              const pd = await p.json();
              setAvatarUrl(pd.profile?.avatar_url || null);
              setDisplayName(pd.profile?.nome || pd.profile?.email || null);
              try { setCachedProfile(pd.profile); } catch {}
            }
          } catch { /* ignore */ }
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
        } catch { /* ignore */ }
      } catch { /* role check failed */ }
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
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside
      style={{
        width: isSidebarCollapsed ? "68px" : "220px",
        minWidth: isSidebarCollapsed ? "68px" : "220px",
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border-sidebar)",
      }}
      className="flex flex-col h-screen select-none relative transition-all duration-300 ease-in-out z-30 font-sans flex-shrink-0"
    >
      {/* Header */}
      {!isSidebarCollapsed ? (
        <div className="pt-4 pb-3 px-3 flex items-center justify-between border-b border-[var(--border-default)]/40">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 bg-[var(--text-primary)] rounded-[6px] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-[14px]">R.</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[14px] font-semibold text-[var(--text-primary)] leading-tight truncate">RankHire BR</span>
              <span className="text-[10px] text-[var(--text-muted)] truncate">recrutamento IA</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationPopover />
            <button
              type="button"
              onClick={toggleSidebar}
              title="Recolher menu lateral"
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
            >
              <PanelLeftClose size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-4 pb-3 px-2 flex flex-col items-center gap-3 border-b border-[var(--border-default)]/40">
          <div className="w-7 h-7 bg-[var(--text-primary)] rounded-[6px] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-[14px]">R.</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <NotificationPopover />
            <button
              type="button"
              onClick={toggleSidebar}
              title="Expandir menu lateral"
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
            >
              <PanelLeftOpen size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Quick search */}
      {!isSidebarCollapsed && (
        <div className="px-3 my-3">
          <button className="w-full flex items-center justify-between bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] transition-colors rounded-md px-2.5 py-1.5 text-[12px] text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <SearchIcon size={14} />
              <span>Busca rápida</span>
            </div>
            <span className="border border-[var(--border-default)] bg-[var(--bg-card)] rounded-[4px] px-1.5 py-0.5 text-[10px] font-mono">
              ⌘K
            </span>
          </button>
        </div>
      )}

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide py-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-3 last:mb-0">
            {!isSidebarCollapsed && (
              <span className="block px-4 pb-1 pt-3 text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.08em]">
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
                        href={isLocked ? "/dashboard" : href}
                        onClick={(e) => {
                          if (isLocked) e.preventDefault();
                          if (onNavigate) onNavigate(item.id);
                        }}
                        title={isLocked ? `${item.label} — disponível nos planos pagos` : item.label}
                        className={`p-2.5 rounded-lg transition-colors relative flex items-center justify-center ${
                          isActive
                            ? "bg-[var(--green-bg)] text-[var(--green)] font-medium"
                            : isLocked
                            ? "text-[var(--text-muted)] opacity-60"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                        {isLocked && <Lock size={10} className="absolute top-1 right-1 text-amber-500" />}
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={item.id} className="w-full">
                    <Link
                      href={isLocked ? "/dashboard" : href}
                      onClick={(e) => {
                        if (isLocked) e.preventDefault();
                        if (onNavigate) onNavigate(item.id);
                      }}
                      title={isLocked ? `${item.label} — disponível nos planos pagos` : item.label}
                      className={
                        isActive
                          ? "flex items-center gap-2.5 w-full text-left transition-colors text-[13px] bg-[var(--green-bg)] text-[var(--green)] font-medium border-l-2 border-[var(--green)] py-2 pr-3 pl-[10px] ml-1.5 rounded-r-[6px]"
                          : isLocked
                          ? "flex items-center gap-2.5 w-full text-left transition-colors text-[13px] text-[var(--text-muted)] opacity-70 py-2 px-3 mx-2 rounded-[6px]"
                          : "flex items-center gap-2.5 w-full text-left transition-colors text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] py-2 px-3 mx-2 rounded-[6px]"
                      }
                    >
                      <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="truncate flex-1">{item.label}</span>
                      {isLocked && <Lock size={12} className="flex-shrink-0 text-amber-500 ml-auto" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* ── Configurações com Submenu ── */}
        <div className="mb-3">
          {isSidebarCollapsed ? (
            <div className="w-full flex justify-center py-1">
              <Link
                href="/configuracoes"
                title="Configurações"
                className={`p-2.5 rounded-lg transition-colors flex items-center justify-center ${
                  isSettingsActive
                    ? "bg-[var(--green-bg)] text-[var(--green)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Settings size={18} strokeWidth={isSettingsActive ? 2.5 : 2} />
              </Link>
            </div>
          ) : (
            <>
              {/* Parent: Configurações */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen((o) => !o)}
                className={`flex items-center gap-2.5 w-full text-left transition-colors text-[13px] py-2 px-3 mx-2 rounded-[6px] ${
                  isSettingsActive
                    ? "bg-[var(--green-bg)] text-[var(--green)] font-medium border-l-2 border-[var(--green)] pl-[10px] ml-1.5 rounded-r-[6px]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Settings size={16} strokeWidth={isSettingsActive ? 2.5 : 2} />
                <span className="truncate flex-1">Configurações</span>
                <motion.div
                  animate={{ rotate: isSettingsOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={14} className="text-[var(--text-muted)]" />
                </motion.div>
              </button>

              {/* Submenu */}
              <AnimatePresence initial={false}>
                {isSettingsOpen && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden flex flex-col gap-0.5 pl-4"
                  >
                    <li>
                      <Link
                        href="/configuracoes/perfil"
                        className={`flex items-center gap-2 py-1.5 px-3 rounded-[6px] text-[12px] transition-colors ${
                          pathname === "/configuracoes/perfil"
                            ? "text-[var(--green)] font-semibold bg-[var(--green-bg)]"
                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                        }`}
                      >
                        <UserCircle size={14} />
                        <span>Perfil</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/configuracoes/plano"
                        className={`flex items-center gap-2 py-1.5 px-3 rounded-[6px] text-[12px] transition-colors ${
                          pathname === "/configuracoes/plano"
                            ? "text-[var(--green)] font-semibold bg-[var(--green-bg)]"
                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                        }`}
                      >
                        <CreditCard size={14} />
                        <span>Plano e Cobrança</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/configuracoes/integracoes"
                        className={`flex items-center gap-2 py-1.5 px-3 rounded-[6px] text-[12px] transition-colors ${
                          pathname === "/configuracoes/integracoes" || pathname === "/settings/integrations"
                            ? "text-[var(--green)] font-semibold bg-[var(--green-bg)]"
                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                        }`}
                      >
                        <Zap size={14} />
                        <span>Integrações</span>
                      </Link>
                    </li>
                  </motion.ul>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </nav>

      {/* User footer */}
      <div className="p-2 border-t border-[var(--border-sidebar)] m-2 rounded-lg bg-[var(--bg-card-hover)]/30">
        {!isSidebarCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="avatar" width={32} height={32} className="h-full w-full object-cover" unoptimized />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[var(--green)] text-white flex items-center justify-center text-[12px] font-medium">
                    {(displayName || userEmail || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex flex-col">
                <span className="text-[12px] font-medium text-[var(--text-primary)] truncate leading-tight" title={displayName || userEmail}>
                  {displayName || userEmail}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-[10px] font-semibold px-1.5 rounded-sm ${
                    planoBadge.color === "gold" ? "bg-[rgba(212,175,55,0.15)] text-[var(--gold)]"
                    : planoBadge.color === "green" ? "bg-[rgba(6,214,160,0.15)] text-[#06D6A0]"
                    : planoBadge.color === "blue" ? "bg-[rgba(27,79,216,0.15)] text-[#1B4FD8]"
                    : "bg-[rgba(107,114,128,0.15)] text-[#6B7280]"
                  }`}>
                    {planoBadge.label}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleLogout}
                className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1.5"
                title="Sair"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="avatar" width={32} height={32} className="h-full w-full object-cover" unoptimized />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--green)] text-white flex items-center justify-center text-[12px] font-medium">
                  {(displayName || userEmail || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1.5"
              title="Sair"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
