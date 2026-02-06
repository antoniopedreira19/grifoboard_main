import { Link, useLocation } from "react-router-dom";
import { Building2, KanbanSquare, LayoutDashboard, FileText, Bot, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Building2, label: "Obras", path: "/obras" },
    { icon: KanbanSquare, label: "PMP", path: "/pmp" },
    { icon: LayoutDashboard, label: "PCP", path: "/tarefas" },
    { icon: FileText, label: "Diário", path: "/diarioobra" },
    { icon: Bot, label: "GrifoAI", path: "/grifo-ai" },
    { icon: BookOpen, label: "Playbook", path: "/playbook" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-[env(safe-area-inset-bottom)] md:hidden shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-14 px-0.5">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-0.5 active:scale-90 transition-all duration-200 tap-highlight-transparent",
                active ? "text-[#A47528]" : "text-slate-400 hover:text-slate-600",
              )}
            >
              <div className={cn("p-0.5 rounded-lg transition-all duration-300", active && "bg-[#A47528]/10")}>
                <item.icon
                  className={cn("h-5 w-5 transition-all", active && "fill-current")}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </div>
              <span
                className={cn("text-[8px] leading-tight transition-all", active ? "font-bold" : "font-medium")}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
