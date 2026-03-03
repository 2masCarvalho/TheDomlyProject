import { Home, Calendar, LayoutDashboard, Building2, MessageSquare, Camera, Shield, Key, Settings, LogOut, Wrench, ClipboardList, Users, ShieldCheck } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAtivos } from '@/context/AtivosContext';
import { useOcorrencias } from '@/context/OcorrenciasContext';


export function AppSidebar() {
  const { user, logout } = useAuth();
  const { ativos } = useAtivos();
  const { ocorrencias } = useOcorrencias();

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
    { title: "Definições", url: "/definicoes", icon: Settings },
  ];


  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="group flex flex-col h-screen w-16 hover:w-60 bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out overflow-hidden">
      {/* Header with Avatar and Email */}
      <div className="flex flex-col items-center gap-3 p-4 min-h-[120px]">
        <Avatar className="h-10 w-10 group-hover:h-12 group-hover:w-12 transition-all duration-300 flex-shrink-0">
          <AvatarImage src="" />
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold border-2 border-white">
            {getUserInitials()}
          </AvatarFallback>
        </Avatar>

        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs font-normal text-sidebar-foreground/70 truncate max-w-full px-2">
          {user?.email}
        </span>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Menu Items */}
      <nav className="flex-1 flex flex-col gap-1 py-4 px-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            className="flex items-center justify-between h-10 px-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            activeClassName="bg-primary text-primary-foreground"
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm font-medium">
                {item.title}
              </span>
            </div>

            {item.badge > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white group-hover:mr-2">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Logout */}
      <div className="p-2">
        <Button
          variant="ghost"
          onClick={logout}
          className="flex items-center gap-3 h-10 w-full px-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm font-medium">
            Logout
          </span>
        </Button>
      </div>
    </div>
  );
}
