import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Search, Settings, User, Mail, HelpCircle, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const match = Object.keys(routeTitles).find((key) => pathname.startsWith(key + "/"));
  return match ? routeTitles[match] : "Domly";
}

export function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, avatarUrl, logout } = useAuth();

  const pageTitle = getPageTitle(location.pathname);

  const getInitials = () => {
    if (profile?.primeiro_nome && profile?.ultimo_nome) {
      return `${profile.primeiro_nome[0]}${profile.ultimo_nome[0]}`.toUpperCase();
    }
    return "U";
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-30 grid grid-cols-3 items-center px-6 h-16 bg-[#1B2A4A] text-white flex-shrink-0">
      {/* Page title */}
      <span className="text-sm font-semibold tracking-wide justify-self-start">
        Domly &nbsp;|&nbsp; {pageTitle}
      </span>

      {/* Search bar */}
      <div className="relative justify-self-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Pesquisar..."
          className="bg-[#243756] text-white placeholder-slate-400 text-sm pl-9 pr-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-400 w-64 transition-colors"
        />
      </div>

      {/* Profile avatar + dropdown */}
      <div className="justify-self-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="h-9 w-9 rounded-full overflow-hidden bg-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 border-2 border-slate-500 focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <span>{getInitials()}</span>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-48 rounded-xl border border-white/10 bg-[#1B2A4A]/80 backdrop-blur-lg text-white shadow-xl p-1"
        >
          <DropdownMenuItem
            onClick={() => navigate("/configuracoes")}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 cursor-pointer transition-colors focus:bg-white/10 focus:text-white"
          >
            <Settings className="h-4 w-4" />
            Definições
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/configuracoes")}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 cursor-pointer transition-colors focus:bg-white/10 focus:text-white"
          >
            <User className="h-4 w-4" />
            Perfil
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/30 cursor-not-allowed"
          >
            <Mail className="h-4 w-4" />
            Mensagens
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/suporte")}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 cursor-pointer transition-colors focus:bg-white/10 focus:text-white"
          >
            <HelpCircle className="h-4 w-4" />
            Suporte
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-white/10 my-1" />

          <DropdownMenuItem
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer transition-colors focus:bg-red-500/10 focus:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}
