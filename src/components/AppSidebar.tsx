import React from "react";
import { Calendar, LayoutDashboard, Building2, MessageSquare, Camera, Shield, Settings, LogOut, Wrench, ClipboardList, Users, ShieldCheck } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useAtivos } from '@/context/AtivosContext';
import { useOcorrencias } from '@/context/OcorrenciasContext';
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

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const pendingCount = ativos?.reduce((acc, ativo) =>
    acc + (ativo.alertas?.filter(a => a.estado === 'pendente').length || 0), 0
  ) || 0;

  const openOcorrencias = ocorrencias?.filter((o) => !['resolvida', 'fechada'].includes(o.estado)).length || 0;

  interface MenuItem {
    title: string;
    url: string;
    icon: any;
    badge?: number;
  }

  const menuItems: MenuItem[] = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Condomínios", url: "/condominios", icon: Building2 },
    { title: "Ocorrências", url: "/ocorrencias", icon: ClipboardList, badge: openOcorrencias },
    { title: "Trabalhos", url: "/trabalhos", icon: Wrench },
    { title: "Técnicos", url: "/tecnicos", icon: Users },
    { title: "Conformidade", url: "/conformidade", icon: ShieldCheck },
    { title: "Calendário", url: "/calendario", icon: Calendar },
    { title: "Alertas", url: "/alertas", icon: Shield, badge: pendingCount },
    { title: "Manutenção", url: "/manutencao", icon: Camera },
    { title: "Suporte", url: "/suporte", icon: MessageSquare },
    { title: "Definições", url: "/configuracoes", icon: Settings },
  ];

  const getInitials = () => {
    if (profile?.primeiro_nome && profile?.ultimo_nome) {
      return `${profile.primeiro_nome[0]}${profile.ultimo_nome[0]}`.toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() ?? 'U';
  };

  const displayName = profile?.primeiro_nome
    ? `${profile.primeiro_nome} ${profile.ultimo_nome ?? ''}`.trim()
    : user?.email ?? '';

  return (
    <div
      className="fixed left-0 top-0 z-40 flex flex-col h-screen bg-gradient-to-b from-[#1B2A4A] to-[#0a1128] transition-all duration-300 ease-in-out overflow-hidden"
      style={{ width: expanded ? "15rem" : "5rem" }}
      onMouseEnter={() => onExpandChange(true)}
      onMouseLeave={() => onExpandChange(false)}
    >
      {/* Header with Logo, Greeting and Company */}
      <div className="flex flex-col items-center gap-2 p-4">
        <img
          src={DomlyLogo}
          alt="Domly"
          className="transition-all duration-300 flex-shrink-0 rounded-full object-cover"
          style={{
            width: expanded ? "3.5rem" : "3rem",
            height: expanded ? "3.5rem" : "3rem",
            minWidth: expanded ? "3.5rem" : "3rem",
          }}
        />
      </div>

      {/* Menu Items */}
      <nav
        className="sidebar-nav flex-1 flex flex-col justify-center gap-1 py-4 px-4 overflow-y-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        {menuItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            className="flex items-center justify-between h-10 px-3 rounded-lg text-white/80 border border-transparent transition-all duration-300 ease-in-out hover:bg-white/10 hover:backdrop-blur-md hover:border-white/10 hover:text-white"
            activeClassName="bg-white/20 backdrop-blur-lg border-white/20 shadow-sm text-white"
          >
            <div className="flex items-center gap-3">
              <item.icon className={`transition-all duration-300 flex-shrink-0 ${expanded ? "h-5 w-5" : "h-6 w-6"}`} />
              <span className={`transition-opacity duration-300 whitespace-nowrap text-sm font-medium ${expanded ? "opacity-100" : "opacity-0"}`}>
                {item.title}
              </span>
            </div>

            {item.badge > 0 && (
              <span className={`flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white ${expanded ? "mr-2" : ""}`}>
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="flex items-center justify-start gap-3 h-10 w-full px-3 rounded-lg text-white/80 border border-transparent transition-all duration-300 ease-in-out hover:bg-white/10 hover:backdrop-blur-md hover:border-white/10 hover:text-white"
        >
          <LogOut className={`transition-all duration-300 flex-shrink-0 ${expanded ? "h-5 w-5" : "h-6 w-6"}`} />
          <span className={`transition-opacity duration-300 whitespace-nowrap text-sm font-medium ${expanded ? "opacity-100" : "opacity-0"}`}>
            Logout
          </span>
        </Button>
      </div>
    </div>
  );
}
