import React from "react";
import {
  Calendar,
  LayoutDashboard,
  Building2,
  MessageSquare,
  Camera,
  Shield,
  Settings,
  LogOut,
  Wrench,
  ClipboardList,
  Users,
  ShieldCheck,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAtivos } from "@/context/AtivosContext";
import { useOcorrencias } from "@/context/OcorrenciasContext";
import DomlyLogo from "@/assets/DomlyRound.png";

interface AppSidebarProps {
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
}

export function AppSidebar({ expanded, onExpandChange }: AppSidebarProps) {
  const { user, profile, logout } = useAuth();
  const { ativos } = useAtivos();
  const { ocorrencias } = useOcorrencias();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const pendingCount =
    ativos?.reduce(
      (acc, ativo) =>
        acc + (ativo.alertas?.filter((a) => a.estado === "pendente").length || 0),
      0
    ) || 0;

  const openOcorrencias =
    ocorrencias?.filter((o) => !["resolvida", "fechada"].includes(o.estado)).length || 0;

  interface MenuItem {
    title: string;
    url: string;
    icon: any;
    badge?: number;
    section?: string;
  }

  const menuItems: MenuItem[] = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, section: "principal" },
    { title: "Condomínios", url: "/condominios", icon: Building2, section: "principal" },
    { title: "Ocorrências", url: "/ocorrencias", icon: ClipboardList, badge: openOcorrencias, section: "operações" },
    { title: "Trabalhos", url: "/trabalhos", icon: Wrench, section: "operações" },
    { title: "Técnicos", url: "/tecnicos", icon: Users, section: "operações" },
    { title: "Conformidade", url: "/conformidade", icon: ShieldCheck, section: "gestão" },
    { title: "Calendário", url: "/calendario", icon: Calendar, section: "gestão" },
    { title: "Alertas", url: "/alertas", icon: Shield, badge: pendingCount, section: "gestão" },
    { title: "Manutenção", url: "/manutencao", icon: Camera, section: "gestão" },
  ];

  const bottomItems: MenuItem[] = [
    { title: "Suporte", url: "/suporte", icon: MessageSquare },
    { title: "Definições", url: "/configuracoes", icon: Settings },
  ];

  const getInitials = () => {
    if (profile?.primeiro_nome && profile?.ultimo_nome) {
      return `${profile.primeiro_nome[0]}${profile.ultimo_nome[0]}`.toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() ?? "U";
  };

  const displayName = profile?.primeiro_nome
    ? `${profile.primeiro_nome} ${profile.ultimo_nome ?? ""}`.trim()
    : user?.email ?? "";

  const isActive = (url: string) =>
    location.pathname === url || location.pathname.startsWith(url + "/");

  const sections = ["principal", "operações", "gestão"] as const;
  const sectionLabels: Record<string, string> = {
    principal: "Principal",
    operações: "Operações",
    gestão: "Gestão",
  };

  return (
    <div
      className="fixed left-0 top-0 z-40 flex flex-col h-screen transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden border-r border-white/[0.06]"
      style={{
        width: expanded ? "15.5rem" : "4.5rem",
        background: "linear-gradient(180deg, #0f1729 0%, #0a1128 50%, #080e20 100%)",
      }}
      onMouseEnter={() => onExpandChange(true)}
      onMouseLeave={() => onExpandChange(false)}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 h-16 flex-shrink-0 border-b border-white/[0.06]">
        <img
          src={DomlyLogo}
          alt="Domly"
          className="rounded-full object-cover flex-shrink-0 transition-all duration-300"
          style={{
            width: expanded ? "2.25rem" : "2rem",
            height: expanded ? "2.25rem" : "2rem",
          }}
        />
        <span
          className="text-white/90 font-semibold text-[15px] tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300"
          style={{ opacity: expanded ? 1 : 0, maxWidth: expanded ? "10rem" : "0" }}
        >
          Domly
        </span>
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2.5 space-y-0.5"
        style={{ scrollbarWidth: "none" }}
      >
        {sections.map((section) => {
          const items = menuItems.filter((m) => m.section === section);
          return (
            <div key={section}>
              {/* Section label (expanded) */}
              <div
                className="overflow-hidden transition-all duration-300"
                style={{
                  maxHeight: expanded ? "1.75rem" : "0",
                  opacity: expanded ? 1 : 0,
                  marginTop: section !== "principal" ? "0.5rem" : "0",
                  marginBottom: expanded ? "0.25rem" : "0",
                }}
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/20 pl-3 select-none">
                  {sectionLabels[section]}
                </span>
              </div>

              {/* Thin separator (collapsed) */}
              {!expanded && section !== "principal" && (
                <div className="mx-3 my-2.5 h-px bg-white/[0.06]" />
              )}

              {items.map((item) => {
                const active = isActive(item.url);
                return (
                  <NavLink
                    key={item.title}
                    to={item.url}
                    className={`
                      group relative flex items-center gap-3 h-10 rounded-lg transition-all duration-200
                      ${expanded ? "px-3" : "px-0 justify-center"}
                      ${active
                        ? "bg-white/[0.08] text-white"
                        : "text-white/45 hover:text-white/80 hover:bg-white/[0.04]"
                      }
                    `}
                    activeClassName=""
                  >
                    {/* Active indicator bar */}
                    {active && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-blue-400"
                        style={{ boxShadow: "0 0 8px rgba(96,165,250,0.4)" }}
                      />
                    )}

                    <item.icon
                      className={`flex-shrink-0 transition-all duration-200 ${
                        expanded ? "h-[18px] w-[18px]" : "h-5 w-5"
                      } ${active ? "text-blue-400" : ""}`}
                    />

                    <span
                      className="text-[13px] font-medium whitespace-nowrap overflow-hidden transition-all duration-300"
                      style={{ opacity: expanded ? 1 : 0, maxWidth: expanded ? "10rem" : "0" }}
                    >
                      {item.title}
                    </span>

                    {/* Badge */}
                    {(item.badge ?? 0) > 0 && (
                      <span
                        className={`
                          flex items-center justify-center rounded-full bg-red-500/90 text-white text-[10px] font-bold leading-none
                          transition-all duration-300
                          ${expanded
                            ? "ml-auto h-[18px] min-w-[18px] px-1"
                            : "absolute -top-0.5 -right-0.5 h-[15px] min-w-[15px] px-0.5 text-[9px]"
                          }
                        `}
                      >
                        {(item.badge ?? 0) > 99 ? "99+" : item.badge}
                      </span>
                    )}

                    {/* Tooltip (collapsed) */}
                    {!expanded && (
                      <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#151d33] text-white/90 text-xs font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-xl border border-white/[0.08] z-50">
                        {item.title}
                        {(item.badge ?? 0) > 0 && (
                          <span className="ml-1.5 text-red-400 font-bold">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* ── Bottom ──────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-white/[0.06] pt-2 pb-1 px-2.5 space-y-0.5">
        {bottomItems.map((item) => {
          const active = isActive(item.url);
          return (
            <NavLink
              key={item.title}
              to={item.url}
              className={`
                group relative flex items-center gap-3 h-9 rounded-lg transition-all duration-200
                ${expanded ? "px-3" : "px-0 justify-center"}
                ${active
                  ? "bg-white/[0.08] text-white"
                  : "text-white/35 hover:text-white/65 hover:bg-white/[0.04]"
                }
              `}
              activeClassName=""
            >
              <item.icon
                className={`flex-shrink-0 transition-all duration-200 ${
                  expanded ? "h-4 w-4" : "h-[18px] w-[18px]"
                } ${active ? "text-blue-400" : ""}`}
              />
              <span
                className="text-[12px] font-medium whitespace-nowrap overflow-hidden transition-all duration-300"
                style={{ opacity: expanded ? 1 : 0, maxWidth: expanded ? "10rem" : "0" }}
              >
                {item.title}
              </span>
              {!expanded && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#151d33] text-white/90 text-xs font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-xl border border-white/[0.08] z-50">
                  {item.title}
                </div>
              )}
            </NavLink>
          );
        })}

        {/* ── User card ─────────────────────────────────────── */}
        <div
          className={`
            group mt-1.5 mb-1 flex items-center gap-2.5 rounded-lg cursor-pointer transition-all duration-200
            hover:bg-white/[0.05]
            ${expanded ? "p-2.5" : "p-0 justify-center py-2.5"}
          `}
          onClick={handleLogout}
          title="Sair da conta"
        >
          <div
            className="relative flex-shrink-0 rounded-full flex items-center justify-center text-white text-[11px] font-bold transition-all duration-300"
            style={{
              width: expanded ? "2rem" : "1.75rem",
              height: expanded ? "2rem" : "1.75rem",
              background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
            }}
          >
            {getInitials()}
            {/* Online dot */}
            <div
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a1128]"
              style={{ display: expanded ? "block" : "none" }}
            />
          </div>

          <div
            className="flex-1 min-w-0 overflow-hidden transition-all duration-300"
            style={{ opacity: expanded ? 1 : 0, maxWidth: expanded ? "10rem" : "0" }}
          >
            <p className="text-[12px] font-medium text-white/75 truncate leading-tight">
              {displayName}
            </p>
            <p className="text-[10px] text-white/25 truncate leading-tight mt-0.5 group-hover:text-red-400/70 transition-colors">
              Sair da conta
            </p>
          </div>

          <LogOut
            className="flex-shrink-0 h-3.5 w-3.5 text-white/20 group-hover:text-red-400/70 transition-all duration-300"
            style={{ opacity: expanded ? 1 : 0 }}
          />

          {/* Tooltip (collapsed) */}
          {!expanded && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#151d33] text-white/90 text-xs font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-xl border border-white/[0.08] z-50">
              {displayName} · Sair
            </div>
          )}
        </div>
      </div>
    </div>
  );
}