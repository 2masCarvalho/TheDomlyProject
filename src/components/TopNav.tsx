import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  Settings,
  User,
  HelpCircle,
  LogOut,
  Bell,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAtivos } from "@/context/AtivosContext";

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/condominios": "Condomínios",
  "/ocorrencias": "Ocorrências",
  "/trabalhos": "Trabalhos",
  "/tecnicos": "Técnicos",
  "/conformidade": "Conformidade",
  "/calendario": "Calendário",
  "/alertas": "Alertas",
  "/manutencao": "Manutenção",
  "/suporte": "Suporte",
  "/configuracoes": "Definições",
};

function getPageTitle(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname];
  const match = Object.keys(routeTitles).find((key) =>
    pathname.startsWith(key + "/")
  );
  return match ? routeTitles[match] : "Domly";
}

export function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, avatarUrl, logout } = useAuth();
  const { ativos } = useAtivos();

  const pageTitle = getPageTitle(location.pathname);

  const pendingAlerts =
    ativos?.reduce(
      (acc, ativo) =>
        acc + (ativo.alertas?.filter((a) => a.estado === "pendente").length || 0),
      0
    ) || 0;

  const getInitials = () => {
    if (profile?.primeiro_nome && profile?.ultimo_nome) {
      return `${profile.primeiro_nome[0]}${profile.ultimo_nome[0]}`.toUpperCase();
    }
    return "U";
  };

  const displayName = profile?.primeiro_nome
    ? `${profile.primeiro_nome} ${profile.ultimo_nome ?? ""}`.trim()
    : "";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 h-16 flex-shrink-0 border-b border-white/[0.06]"
      style={{
        background: "#0f1729",
      }}
    >
      {/* Left — Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-white/50 tracking-wide">Domly</span>
        <ChevronRight className="h-3.5 w-3.5 text-white/20" />
        <span className="font-semibold text-white/90 tracking-wide">{pageTitle}</span>
      </div>

      {/* Center — Search */}
      <div className="hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25 pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar..."
            className="w-56 lg:w-72 bg-white/[0.05] text-white/80 placeholder-white/25 text-[13px] pl-9 pr-4 py-2 rounded-lg border border-white/[0.08] focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all duration-200"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-0.5 text-[10px] text-white/20 font-mono">
            <span className="bg-white/[0.06] px-1 py-0.5 rounded">⌘</span>
            <span className="bg-white/[0.06] px-1 py-0.5 rounded">K</span>
          </kbd>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate("/alertas")}
          className="relative h-9 w-9 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all duration-200"
        >
          <Bell className="h-4 w-4" />
          {pendingAlerts > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {pendingAlerts > 99 ? "99+" : pendingAlerts}
            </span>
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 h-9 pl-1 pr-2 rounded-lg hover:bg-white/[0.06] transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-white/10">
              <div
                className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)" }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                ) : (
                  <span>{getInitials()}</span>
                )}
              </div>
              <span className="hidden lg:block text-[12px] font-medium text-white/60">{displayName}</span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" sideOffset={8} className="w-52 rounded-xl border border-white/[0.08] bg-[#131a2e]/95 backdrop-blur-xl text-white shadow-2xl p-1.5">
            <div className="px-3 py-2.5 mb-1">
              <p className="text-[13px] font-semibold text-white/90">{displayName || "Utilizador"}</p>
              <p className="text-[11px] text-white/35 mt-0.5">Gestor de condomínios</p>
            </div>
            <DropdownMenuSeparator className="bg-white/[0.06] my-1" />
            <DropdownMenuItem onClick={() => navigate("/configuracoes")} className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-white/70 hover:text-white hover:bg-white/[0.06] cursor-pointer transition-colors focus:bg-white/[0.06] focus:text-white">
              <User className="h-4 w-4 text-white/40" /> Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/configuracoes")} className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-white/70 hover:text-white hover:bg-white/[0.06] cursor-pointer transition-colors focus:bg-white/[0.06] focus:text-white">
              <Settings className="h-4 w-4 text-white/40" /> Definições
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/suporte")} className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-white/70 hover:text-white hover:bg-white/[0.06] cursor-pointer transition-colors focus:bg-white/[0.06] focus:text-white">
              <HelpCircle className="h-4 w-4 text-white/40" /> Suporte
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/[0.06] my-1" />
            <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-red-400/80 hover:text-red-300 hover:bg-red-500/10 cursor-pointer transition-colors focus:bg-red-500/10 focus:text-red-300">
              <LogOut className="h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}