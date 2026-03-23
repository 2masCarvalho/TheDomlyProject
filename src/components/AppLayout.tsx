import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { Outlet } from "react-router-dom";

export function AppLayout() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar expanded={expanded} onExpandChange={setExpanded} />
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ paddingLeft: expanded ? "15.5rem" : "4.5rem" }}
      >
        <TopNav />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}