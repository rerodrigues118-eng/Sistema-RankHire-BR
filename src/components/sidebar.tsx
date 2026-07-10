"use client";

import React, { useState, useEffect } from "react";
import Image from 'next/image';
import type { PageId } from "@/lib/types";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getCachedProfile, setCachedProfile } from "@/lib/profile-cache";

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
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
  const [userEmail, setUserEmail] = useState<string>("Carregando...");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const router = useRouter();

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
          // use user metadata as fallback display name
          const userObj = user as unknown as Record<string, unknown> | undefined;
          const metaName = (userObj?.user_metadata as Record<string, unknown> | undefined)?.full_name || (userObj?.user_metadata as Record<string, unknown> | undefined)?.name || null;
          if (metaName) setDisplayName(metaName as string);
        }

        const res = await fetch('/api/me/role', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUserEmail(data.email || "Usuário");
          // prefer cached profile to avoid flashes
          try {
            const cached = getCachedProfile();
            if (cached) {
              setAvatarUrl(cached.avatar_url || null);
              setDisplayName(cached.nome || cached.email || null);
            } else {
              const p = await fetch('/api/profile', { credentials: 'include' });
              if (p.ok) {
                const pd = await p.json();
                setAvatarUrl(pd.profile?.avatar_url || null);
                setDisplayName(pd.profile?.nome || pd.profile?.email || null);
                try { setCachedProfile(pd.profile); } catch {}
              }
            }
          } catch {
            // ignore
          }
        }
      } catch {
        // role check failed
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
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside 
      style={{ 
        width: "220px", 
        minWidth: "220px", 
        background: "var(--bg-sidebar)", 
        borderRight: "1px solid var(--border-sidebar)" 
      }}
      className="flex flex-col h-screen select-none relative"
    >
      {/* Header / Logo */}
      <div className="pt-5 pb-3 px-4 flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 bg-[var(--text-primary)] rounded-[6px] flex items-center justify-center">
            <span className="text-white font-bold text-[14px]">R.</span>
          </div>
          <span className="text-[14px] font-medium text-[var(--text-primary)]">RankHire BR</span>
        </div>
        <span className="text-[11px] text-[var(--text-muted)] ml-9">recrutamento com IA</span>
      </div>

      {/* Busca rápida fake */}
      <div className="px-4 mb-4 mt-2">
        <button className="w-full flex items-center justify-between bg-[var(--bg-input)] hover:bg-[#E5E7EB] transition-colors rounded-md px-2.5 py-1.5 text-[12px] text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <SearchIcon size={14} />
            <span>Busca rápida</span>
          </div>
          <span className="border border-[var(--border-default)] bg-white rounded-[4px] px-1.5 py-0.5 text-[10px] font-mono">⌘K</span>
        </button>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide py-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-4 last:mb-0">
            <span 
              className="block px-5 pb-1 pt-4 text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.08em]"
            >
              {section.label}
            </span>
            <ul className="flex flex-col">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                
                return (
                  <li key={item.id} className="w-full">
                    <button
                      onClick={() => onNavigate(item.id)}
                      className={
                        isActive
                          ? "flex items-center gap-2.5 w-full text-left transition-colors text-[13px] bg-[var(--green-bg)] text-[#059669] font-medium border-l-2 border-[var(--green)] py-2 pr-3 pl-[10px] ml-1.5 rounded-r-[6px]"
                          : "flex items-center gap-2.5 w-full text-left transition-colors text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[#374151] py-2 px-3 mx-2 rounded-[6px] w-[calc(100%-16px)]"
                      }
                    >
                      <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-[var(--border-sidebar)] flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition-colors m-2 rounded-lg">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="avatar" width={32} height={32} className="h-full w-full object-cover" unoptimized />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#059669] text-white flex items-center justify-center text-[12px] font-medium">
                {(displayName || userEmail || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="text-[12px] font-medium text-[var(--text-primary)] truncate leading-tight" title={displayName || userEmail}>
              {displayName || userEmail}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] bg-[rgba(212,175,55,0.15)] text-[var(--gold)] font-semibold px-1.5 rounded-sm">PRO</span>
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1" title="Sair">
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
