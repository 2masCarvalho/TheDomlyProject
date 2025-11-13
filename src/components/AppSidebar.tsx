import { Home, Calendar, LayoutDashboard, Building2, MessageSquare, Camera, Shield, Key, Settings, LogOut, Menu } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    <TooltipProvider>
      <div className="flex flex-col h-screen w-20 bg-sidebar border-r border-sidebar-border">
        {/* Header with Avatar and Menu */}
        <div className="flex flex-col items-center gap-4 p-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Menu Items */}
        <nav className="flex-1 flex flex-col items-center gap-2 py-4">
          {menuItems.map((item) => (
            <Tooltip key={item.title} delayDuration={0}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.url}
                  className="flex items-center justify-center h-12 w-12 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  activeClassName="bg-primary text-primary-foreground"
                >
                  <item.icon className="h-6 w-6" />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover text-popover-foreground">
                {item.title}
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>

        <Separator className="bg-sidebar-border" />

        {/* Logout */}
        <div className="p-4">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="h-12 w-12 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <LogOut className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-popover text-popover-foreground">
              Logout
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
