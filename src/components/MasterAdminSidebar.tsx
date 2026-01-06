import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import {
  Building2,
  FileText,
  Database,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const masterAdminMenuItems = [
  { path: "/master-admin", label: "Empresas", icon: Building2 },
  { path: "/formularios", label: "Formulários", icon: FileText },
  { path: "/base-de-dados", label: "Base de Dados", icon: Database },
];

const MasterAdminSidebar = () => {
  const { userSession, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("masterAdminSidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("masterAdminSidebarCollapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const getInitials = (name?: string | null) => {
    if (!name) return "MA";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const userName = userSession?.user?.user_metadata?.full_name || "Master Admin";
  const userEmail = userSession?.user?.email || "";
  const userAvatar = userSession?.user?.user_metadata?.avatar_url;

  return (
    <TooltipProvider>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? "5rem" : "16rem" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="h-screen bg-primary text-primary-foreground flex flex-col shadow-2xl relative z-30 font-sans border-r border-white/10 hidden md:flex flex-shrink-0"
      >
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-9 z-40 bg-secondary text-white p-1 rounded-full shadow-md border border-white/20 hover:bg-secondary/90 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div
          className={cn(
            "flex items-center border-b border-white/10 bg-black/10 transition-all duration-300",
            isCollapsed ? "justify-center p-4 h-20" : "justify-center p-6 h-24",
          )}
        >
          <img
            src="/lovable-uploads/grifo-logo-header.png"
            alt="Grifo"
            className={cn(
              "object-contain transition-all duration-300 hover:scale-105",
              isCollapsed ? "h-8 w-8" : "h-12 w-auto",
            )}
            loading="eager"
          />
        </div>

        {/* Master Admin Badge */}
        {!isCollapsed && (
          <div className="px-3 py-4">
            <div className="px-4 py-2 bg-secondary/20 border border-secondary/30 rounded-xl">
              <span className="text-xs uppercase tracking-wider text-secondary font-semibold">
                Master Admin
              </span>
            </div>
          </div>
        )}

        <nav className={cn("flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden", isCollapsed && "pt-4")}>
          {masterAdminMenuItems.map((item) => {
            const isActive = location.pathname === item.path;

            const LinkContent = (
              <Link
                to={item.path}
                className={cn(
                  "relative flex items-center rounded-lg transition-all duration-200 group mb-1 overflow-hidden",
                  isCollapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-4 py-3 w-full",
                  isActive
                    ? "bg-secondary text-white shadow-lg font-medium"
                    : "hover:bg-white/10 hover:text-white text-primary-foreground/80",
                )}
              >
                <item.icon
                  className={cn(
                    "transition-colors flex-shrink-0 h-5 w-5",
                    isActive ? "text-white" : "text-secondary group-hover:text-white",
                  )}
                />

                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="truncate text-sm font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}

                {isActive && (
                  <motion.div
                    layoutId="masterAdminActiveIndicator"
                    className={cn(
                      "absolute bg-white",
                      isCollapsed
                        ? "left-0 top-0 bottom-0 w-1 h-full rounded-l-none"
                        : "right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full",
                    )}
                  />
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.path} delayDuration={0}>
                  <TooltipTrigger asChild>{LinkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-primary border-white/10 text-white font-medium z-50">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.path}>{LinkContent}</div>;
          })}
        </nav>

        {/* Footer (User Profile) */}
        <div
          className={cn(
            "m-4 rounded-xl bg-black/20 border border-white/5 overflow-hidden transition-all duration-300",
            isCollapsed ? "p-2 flex flex-col items-center gap-4" : "p-4",
          )}
        >
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3 mb-3")}>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Avatar className="h-10 w-10 border-2 border-secondary shadow-sm cursor-pointer hover:scale-105 transition-transform">
                  <AvatarImage src={userAvatar} />
                  <AvatarFallback className="bg-secondary text-white font-bold text-xs">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="bg-primary border-white/10 text-white">
                  <p>{userName}</p>
                  <p className="text-xs text-white/50">{userEmail}</p>
                </TooltipContent>
              )}
            </Tooltip>

            {!isCollapsed && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-medium text-white truncate" title={userName}>
                  {userName}
                </p>
                <p className="text-xs text-white/50 truncate" title={userEmail}>
                  {userEmail}
                </p>
              </div>
            )}
          </div>

          <div
            className={cn(
              "grid gap-2 border-t border-white/10 transition-all",
              isCollapsed ? "grid-cols-1 w-full pt-2 border-none" : "grid-cols-2 pt-2",
            )}
          >
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    "flex items-center justify-center rounded-md hover:bg-white/10 text-white/70 transition-colors group",
                    isCollapsed ? "p-2 w-full hover:text-secondary" : "p-2 text-xs",
                  )}
                >
                  <Settings className={cn(isCollapsed ? "w-5 h-5" : "w-4 h-4 mr-1")} />
                  {!isCollapsed && "Config"}
                </button>
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right">Configurações</TooltipContent>}
            </Tooltip>

            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => signOut()}
                  className={cn(
                    "flex items-center justify-center rounded-md hover:bg-red-500/20 hover:text-red-200 transition-colors group",
                    isCollapsed ? "p-2 w-full text-red-300" : "p-2 text-xs text-white/70",
                  )}
                >
                  <LogOut className={cn(isCollapsed ? "w-5 h-5" : "w-4 h-4 mr-1")} />
                  {!isCollapsed && "Sair"}
                </button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="bg-destructive text-white border-destructive">
                  Sair
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
};

export default MasterAdminSidebar;
