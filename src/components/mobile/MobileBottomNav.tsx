import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, CheckSquare, Bot, Target, KanbanSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  // As 5 abas principais solicitadas
  const navItems = [
    { icon: KanbanSquare, label: "PMP", path: "/pmp" },
    { icon: LayoutDashboard, label: "PCP", path: "/tarefas" }, // Usei /tarefas conforme seu menu desktop original
    { icon: CheckSquare, label: "Diário", path: "/diarioobra" },
    { icon: Bot, label: "Grifo AI", path: "/grifo-ai" },
    { icon: Target, label: "Metas", path: "/gestao-metas" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-[env(safe-area-inset-bottom)] md:hidden shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-90 transition-all duration-200 tap-highlight-transparent",
                active ? "text-[#A47528]" : "text-slate-400 hover:text-slate-600",
              )}
            >
              <div className={cn("p-1 rounded-xl transition-all duration-300", active && "bg-[#A47528]/10")}>
                <item.icon
                  className={cn("h-6 w-6 transition-all", active && "fill-current")}
                  strokeWidth={active ? 2.5 : 2}
                />
              </div>
              <span
                className={cn("text-[9px] font-medium transition-all", active ? "font-bold scale-105" : "font-medium")}
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
