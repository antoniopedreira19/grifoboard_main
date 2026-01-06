
import * as React from "react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  LayoutList,
  CheckSquare,
  FileText,
  LogOut,
  Building2,
  FileSpreadsheet,
  Database,
  BookOpen,
  Store,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const sidebarVariants = {
  open: {
    width: "248px", // 15.5rem
  },
  closed: {
    width: "60px", // 3.75rem
  },
};

const contentVariants = {
  open: { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
};

const variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      x: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: {
      x: { stiffness: 100 },
    },
  },
};

const transitionProps = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2,
  staggerChildren: 0.1,
};

const staggerVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
};

export function SessionNavBar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { userSession, signOut } = useAuth();
  
  // Check if user is master_admin
  React.useEffect(() => {
    const checkMasterAdmin = async () => {
      if (userSession?.user) {
        try {
          const { supabase } = await import('@/lib/supabase');
          const { data } = await supabase.rpc('is_master_admin');
          setIsMasterAdmin(data || false);
        } catch (error) {
          console.error('Error checking master admin status:', error);
          setIsMasterAdmin(false);
        }
      }
    };
    checkMasterAdmin();
  }, [userSession?.user]);
  
  // Check the current path to determine active tab
  const isMasterAdminActive = location.pathname === "/master-admin";
  const isFormulariosActive = location.pathname.includes("/formularios");
  const isDashboardActive = location.pathname.includes("/dashboard");
  const isTasksActive = location.pathname.includes("/tarefas");
  const isDiarioActive = location.pathname.includes("/diarioobra");
  const isChecklistActive = location.pathname.includes("/checklist");
  const isPlaybookActive = location.pathname.includes("/playbook");
  const isMarketplaceActive = location.pathname.includes("/marketplace");
  
  // Extract the first letter for the avatar fallback
  const userInitial = userSession?.user?.email?.charAt(0).toUpperCase() || "U";
  
  // Sign out handler
  const handleSignOut = async () => {
    await signOut();
  };
  
  // If there's no user, don't show the sidebar
  if (!userSession?.user) {
    return null;
  }
  
  // Master admin has different sidebar - no obra required
  if (isMasterAdmin) {
    return (
      <motion.div
        className={cn(
          "sidebar fixed left-0 z-30 h-[calc(100vh-65px)] shrink-0 border-r top-[65px]",
        )}
        initial={isCollapsed ? "closed" : "open"}
        animate={isCollapsed ? "closed" : "open"}
        variants={sidebarVariants}
        transition={transitionProps}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        <motion.div
          className={`relative z-30 flex text-muted-on-dark h-full shrink-0 flex-col bg-brand transition-all`}
          variants={contentVariants}
        >
          <motion.ul variants={staggerVariants} className="flex h-full flex-col">
            <div className="flex grow flex-col items-center">
              <div className="flex h-full w-full flex-col">
                <div className="flex grow flex-col gap-4">
                  <ScrollArea className="h-16 grow p-2">
                    <div className={cn("flex w-full flex-col gap-1 pt-10")}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "flex h-[46px] w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-brand-2 text-text-on-dark/80 hover:text-text-on-dark justify-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent relative",
                          isMasterAdminActive && "bg-brand-2 text-text-on-dark"
                        )}
                        onClick={() => navigate("/master-admin")}
                      >
                        <Building2 className={cn("h-4 w-4 shrink-0", !isCollapsed && "mr-3")} />
                        {!isCollapsed && (
                          <motion.span
                            variants={variants}
                            initial="closed"
                            animate="open"
                            className="overflow-hidden text-ellipsis whitespace-nowrap text-sm"
                          >
                            Empresas
                          </motion.span>
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        className={cn(
                          "flex h-[46px] w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-brand-2 text-text-on-dark/80 hover:text-text-on-dark justify-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent relative",
                          isFormulariosActive && "bg-brand-2 text-text-on-dark"
                        )}
                        onClick={() => navigate("/formularios")}
                      >
                        <FileSpreadsheet className={cn("h-4 w-4 shrink-0", !isCollapsed && "mr-3")} />
                        {!isCollapsed && (
                          <motion.span
                            variants={variants}
                            initial="closed"
                            animate="open"
                            className="overflow-hidden text-ellipsis whitespace-nowrap text-sm"
                          >
                            Formulários
                          </motion.span>
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        className={cn(
                          "flex h-[46px] w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-brand-2 text-text-on-dark/80 hover:text-text-on-dark justify-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent relative",
                          location.pathname === '/base-de-dados' && "bg-brand-2 text-text-on-dark"
                        )}
                        onClick={() => navigate("/base-de-dados")}
                      >
                        <Database className={cn("h-4 w-4 shrink-0", !isCollapsed && "mr-3")} />
                        {!isCollapsed && (
                          <motion.span
                            variants={variants}
                            initial="closed"
                            animate="open"
                            className="overflow-hidden text-ellipsis whitespace-nowrap text-sm"
                          >
                            Base de Dados
                          </motion.span>
                        )}
                      </Button>
                    </div>
                  </ScrollArea>
                </div>

                <Separator className="bg-brand-2/30" />

                <div className="flex flex-col gap-2 pb-4 pt-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "flex h-[46px] w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-brand-2 text-text-on-dark/80 hover:text-text-on-dark justify-start mx-2",
                          !isCollapsed && "w-[calc(100%-1rem)]"
                        )}
                      >
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback className="bg-brand-3 text-text-on-dark text-sm">
                            {userInitial}
                          </AvatarFallback>
                        </Avatar>
                        {!isCollapsed && (
                          <motion.div
                            variants={variants}
                            initial="closed"
                            animate="open"
                            className="ml-3 flex flex-col items-start overflow-hidden"
                          >
                            <span className="text-sm font-medium text-text-on-dark truncate w-full">
                              Master Admin
                            </span>
                            <span className="text-xs text-text-on-dark/60 truncate w-full">
                              {userSession?.user?.email}
                            </span>
                          </motion.div>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sair</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </motion.ul>
        </motion.div>
      </motion.div>
    );
  }
  
  // Regular users need an active obra
  if (!userSession.obraAtiva) {
    return null;
  }

  return (
    <motion.div
      className={cn(
        "sidebar fixed left-0 z-30 h-[calc(100vh-65px)] shrink-0 border-r top-[65px]",
      )}
      initial={isCollapsed ? "closed" : "open"}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <motion.div
        className={`relative z-30 flex text-muted-on-dark h-full shrink-0 flex-col bg-brand transition-all`}
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          <div className="flex grow flex-col items-center">
            <div className="flex h-full w-full flex-col">
              <div className="flex grow flex-col gap-4">
                <ScrollArea className="h-16 grow p-2">
                  <div className={cn("flex w-full flex-col gap-1 pt-10")}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex h-[46px] w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-brand-2 text-text-on-dark/80 hover:text-text-on-dark justify-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent relative",
                        isDashboardActive && "bg-brand-2 text-text-on-dark before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-accent before:content-['']"
                      )}
                      onClick={() => navigate("/dashboard")}
                      aria-current={isDashboardActive ? "page" : undefined}
                      title={isCollapsed ? "Dashboard" : undefined}
                    >
                      <LayoutDashboard className="h-5 w-5" />{" "}
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="ml-2 text-sm font-medium">Dashboard</p>
                        )}
                      </motion.li>
                    </Button>
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex h-[46px] w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-brand-2 text-text-on-dark/80 hover:text-text-on-dark justify-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent relative",
                        isTasksActive && "bg-brand-2 text-text-on-dark before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-accent before:content-['']"
                      )}
                      onClick={() => navigate("/tarefas")}
                      aria-current={isTasksActive ? "page" : undefined}
                      title={isCollapsed ? "Tarefas" : undefined}
                    >
                      <LayoutList className="h-5 w-5" />{" "}
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="ml-2 text-sm font-medium">Tarefas</p>
                        )}
                      </motion.li>
                    </Button>
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex h-[46px] w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-brand-2 text-text-on-dark/80 hover:text-text-on-dark justify-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent relative",
                        isDiarioActive && "bg-brand-2 text-text-on-dark before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-accent before:content-['']"
                      )}
                      onClick={() => navigate("/diarioobra")}
                      aria-current={isDiarioActive ? "page" : undefined}
                      title={isCollapsed ? "Diário de Obra" : undefined}
                    >
                      <FileText className="h-5 w-5" />{" "}
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="ml-2 text-sm font-medium">Diário de Obra</p>
                        )}
                      </motion.li>
                    </Button>
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex h-[46px] w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-brand-2 text-text-on-dark/80 hover:text-text-on-dark justify-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent relative",
                        isChecklistActive && "bg-brand-2 text-text-on-dark before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-accent before:content-['']"
                      )}
                      onClick={() => navigate("/checklist")}
                      aria-current={isChecklistActive ? "page" : undefined}
                      title={isCollapsed ? "Checklist" : undefined}
                    >
                      <CheckSquare className="h-5 w-5" />{" "}
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="ml-2 text-sm font-medium">Checklist</p>
                        )}
                      </motion.li>
                    </Button>
                    {/* Playbook tab hidden for now
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex h-[46px] w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-brand-2 text-text-on-dark/80 hover:text-text-on-dark justify-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent relative",
                        isPlaybookActive && "bg-brand-2 text-text-on-dark before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-accent before:content-['']"
                      )}
                      onClick={() => navigate("/playbook")}
                      aria-current={isPlaybookActive ? "page" : undefined}
                      title={isCollapsed ? "Playbook" : undefined}
                    >
                      <BookOpen className="h-5 w-5" />{" "}
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="ml-2 text-sm font-medium">Playbook</p>
                        )}
                      </motion.li>
                    </Button>
                    */}
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex h-[46px] w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-brand-2 text-text-on-dark/80 hover:text-text-on-dark justify-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent relative",
                        isMarketplaceActive && "bg-brand-2 text-text-on-dark before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-accent before:content-['']"
                      )}
                      onClick={() => navigate("/marketplace")}
                      aria-current={isMarketplaceActive ? "page" : undefined}
                      title={isCollapsed ? "Marketplace" : undefined}
                    >
                      <Store className="h-5 w-5" />{" "}
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="ml-2 text-sm font-medium">Marketplace</p>
                        )}
                      </motion.li>
                    </Button>
                  </div>
                </ScrollArea>
              </div>
              <div className="flex flex-col p-2">
                <Separator className="mb-2 bg-text-on-dark/20" />
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="w-full" asChild>
                      <Button 
                        variant="ghost" 
                        className="flex h-[46px] w-full flex-row items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-brand-2 text-text-on-dark/80 hover:text-text-on-dark justify-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                        title={isCollapsed ? "Conta" : undefined}
                      >
                        <Avatar className="size-5">
                          <AvatarFallback className="bg-accent text-brand text-sm">
                            {userInitial}
                          </AvatarFallback>
                        </Avatar>
                        <motion.li
                          variants={variants}
                          className="flex w-full items-center gap-2"
                        >
                          {!isCollapsed && (
                            <p className="text-sm font-medium">Conta</p>
                          )}
                        </motion.li>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent sideOffset={5}>
                      <div className="flex flex-row items-center gap-2 p-2">
                        <Avatar className="size-6">
                          <AvatarFallback>
                            {userInitial}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-medium">
                            {userSession?.user?.email || "Usuário"}
                          </span>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="flex items-center gap-2"
                        onClick={handleSignOut}
                      >
                        <LogOut className="h-4 w-4" /> Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </motion.ul>
      </motion.div>
    </motion.div>
  );
}

// IMPORTANT: Remove these exports that cause the circular dependency
// export {
//   Sidebar,
//   SidebarContent,
//   SidebarGroup,
//   SidebarGroupContent,
//   SidebarGroupLabel,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
// } from "@/components/ui/sidebar"

export default SessionNavBar;
