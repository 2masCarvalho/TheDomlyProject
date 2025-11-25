import { Home, Calendar, LayoutDashboard, Building2, MessageSquare, Camera, Shield, Key, Settings, LogOut, Menu } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const menuItems = [
  { title: "Dashboard", url: "/condominios", icon: LayoutDashboard },
  { title: "Properties", url: "/condominios", icon: Building2 },
  { title: "Calendar", url: "/condominios", icon: Calendar },
  { title: "Messages", url: "/condominios", icon: MessageSquare },
  { title: "Inspections", url: "/condominios", icon: Camera },
  { title: "Compliance", url: "/condominios", icon: Shield },
  { title: "Access", url: "/condominios", icon: Key },
  { title: "Settings", url: "/condominios", icon: Settings },
];

export function AppSidebar() {
  const { user, logout } = useAuth();

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
      <nav className="flex-1 flex flex-col gap-2 py-4 px-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            className="flex items-center gap-3 h-12 px-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            activeClassName="bg-primary text-primary-foreground"
          >
            <item.icon className="h-6 w-6 flex-shrink-0" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm font-medium">
              {item.title}
            </span>
          </NavLink>
        ))}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Logout */}
      <div className="p-2">
        <Button
          variant="ghost"
          onClick={logout}
          className="flex items-center gap-3 h-12 w-full px-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-6 w-6 flex-shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm font-medium">
            Logout
          </span>
        </Button>
      </div>
    </div>
  );
}
