import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Store,
  FileText,
  LogOut,
  Settings,
  Building2,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
  Bot,
  Target,
  KanbanSquare,
  Calendar, // Importado ícone de calendário
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import grifoIconGold from "@/assets/grifo-icon-gold.png";
import UserSettingsModal from "./UserSettingsModal";

interface MenuItem {
  path: string;
  label: string;
  icon?: LucideIcon;
  customIcon?: string;
  inDevelopment?: boolean;
}

const CustomSidebar = () => {
  const { userSession, signOut, setObraAtiva } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      if (userSession?.user) {
        const { data } = await supabase.from("usuarios").select("role").eq("id", userSession.user.id).single();
        setIsAdmin(data?.role === "admin" || data?.role === "master_admin");
      }
    };
    checkRole();
  }, [userSession]);

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const menuItems: MenuItem[] = useMemo(
    () => [
      { path: "/playbook", label: "Playbook", icon: BookOpen },
      { path: "/pmp", label: "PMP", icon: KanbanSquare },
      { path: "/tarefas", label: "PCP", icon: LayoutDashboard },
      { path: "/diarioobra", label: "Diário de Obra", icon: FileText },
      { path: "/agenda", label: "Agenda", icon: Calendar }, // Adicionado Agenda aqui
      { path: "/grifoway", label: "GrifoWay", customIcon: grifoIconGold },
      ...(isAdmin ? [{ path: "/gestao-metas", label: "Gestão de Metas", icon: Target }] : []),
      { path: "/marketplace", label: "Marketplace", icon: Store },
      { path: "/grifo-ai", label: "GrifoAI", icon: Bot },
    ],
    [isAdmin],
  );

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const handleSwitchObra = () => {
    setObraAtiva(null);
    navigate("/obras");
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "GR";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const userName = userSession?.user?.user_metadata?.full_name || userSession?.user?.email?.split("@")[0] || "Usuário";
  const userEmail = userSession?.user?.email || "";
  const userAvatar = userSession?.user?.user_metadata?.avatar_url;
  const activeObraName = userSession?.obraAtiva?.nome_obra || "Selecionar";

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
            decoding="sync"
          />
        </div>

        <div className={cn("transition-all duration-300", isCollapsed ? "px-2 py-4" : "px-3 pt-4 pb-2")}>
          {isCollapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSwitchObra}
                  variant="ghost"
                  className="w-full flex justify-center h-10 p-0 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-secondary/50"
                >
                  <Building2 className="w-5 h-5 text-secondary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-primary border-white/10 text-white">
                <p>Obra: {activeObraName}</p>
                <p className="text-xs text-muted-foreground">Clique para trocar</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              onClick={handleSwitchObra}
              variant="ghost"
              className="w-full flex items-center justify-between h-auto py-3 px-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-secondary/50 transition-all group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary text-secondary group-hover:text-white transition-colors">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">Obra Ativa</span>
                  <span className="text-sm font-bold text-white truncate w-full max-w-[120px] text-left">
                    {activeObraName}
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="w-4 h-4 text-white/30 group-hover:text-secondary" />
            </Button>
          )}
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {menuItems.map((item) => {
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
                  (item as any).inDevelopment && "opacity-70",
                )}
              >
                {item.customIcon ? (
                  <img
                    src={item.customIcon}
                    alt={item.label}
                    className={cn(
                      "h-6 w-6 transition-all duration-200 flex-shrink-0",
                      isActive ? "brightness-0 invert" : "group-hover:brightness-0 group-hover:invert",
                    )}
                    loading="eager"
                    decoding="sync"
                  />
                ) : item.icon ? (
                  <item.icon
                    className={cn(
                      "transition-colors flex-shrink-0 h-5 w-5",
                      isActive ? "text-white" : "text-secondary group-hover:text-white",
                    )}
                  />
                ) : null}

                {!isCollapsed && (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="truncate text-sm font-medium"
                    >
                      {item.label}
                    </motion.span>
                    {(item as any).inDevelopment && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 h-4 border-secondary/50 text-secondary bg-secondary/10 whitespace-nowrap"
                      >
                        Em breve
                      </Badge>
                    )}
                  </div>
                )}

                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
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
                    <div className="flex items-center gap-2">
                      {item.label}
                      {(item as any).inDevelopment && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-secondary/30 text-secondary">Em breve</span>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.path}>{LinkContent}</div>;
          })}
        </nav>

        {/* Footer Compacto (User Profile) */}
        <div
          className={cn(
            "m-2 rounded-lg bg-black/20 border border-white/5 overflow-hidden transition-all duration-300",
            isCollapsed ? "p-1 flex flex-col items-center gap-2" : "p-2", // Menos padding e margem
          )}
        >
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-2 mb-2")}>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 border border-secondary shadow-sm cursor-pointer hover:scale-105 transition-transform">
                  <AvatarImage src={userAvatar} />
                  <AvatarFallback className="bg-secondary text-white font-bold text-[10px]">
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
                <p className="text-xs font-medium text-white truncate" title={userName}>
                  {userName}
                </p>
                <p className="text-[10px] text-white/50 truncate" title={userEmail}>
                  {userEmail}
                </p>
              </div>
            )}
          </div>

          <div
            className={cn(
              "grid gap-1 border-t border-white/10 transition-all",
              isCollapsed ? "grid-cols-1 w-full pt-1 border-none" : "grid-cols-2 pt-1",
            )}
          >
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSettingsOpen(true)}
                  className={cn(
                    "flex items-center justify-center rounded hover:bg-white/10 text-white/70 transition-colors group",
                    isCollapsed ? "p-1.5 w-full hover:text-secondary" : "p-1.5 text-[10px]",
                  )}
                >
                  <Settings className={cn(isCollapsed ? "w-4 h-4" : "w-3 h-3 mr-1")} />
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
                    "flex items-center justify-center rounded hover:bg-red-500/20 hover:text-red-200 transition-colors group",
                    isCollapsed ? "p-1.5 w-full text-red-300" : "p-1.5 text-[10px] text-white/70",
                  )}
                >
                  <LogOut className={cn(isCollapsed ? "w-4 h-4" : "w-3 h-3 mr-1")} />
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

        <UserSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      </motion.aside>
    </TooltipProvider>
  );
};

export default CustomSidebar;
