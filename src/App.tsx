import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { RegistryProvider } from "@/context/RegistryContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // Import da Sheet
import { Menu } from "lucide-react"; // Ícone do Menu
import { Button } from "@/components/ui/button";

// Imports de Páginas
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import Index from "@/pages/Index";
import Obras from "@/pages/Obras";
import DiarioObra from "@/pages/DiarioObra";
import NotFound from "@/pages/NotFound";
import MasterAdmin from "@/pages/MasterAdmin";
import Formularios from "@/pages/Formularios";
import BaseDeDados from "@/pages/BaseDeDados";
import Playbook from "@/pages/Playbook";
import Marketplace from "@/pages/Marketplace";
import PortalParceiro from "@/pages/PortalParceiro";
import GrifoWay from "@/pages/GrifoWay";
import GrifoAI from "@/pages/GrifoAI";
import GestaoMetas from "@/pages/GestaoMetas";
import PMP from "@/pages/PMP";
import Agenda from "@/pages/Agenda"; // Import da nova página Agenda
import FormProfissionais from "@/pages/form/Profissionais";
import FormEmpresas from "@/pages/form/Empresas";
import FormFornecedores from "@/pages/form/Fornecedores";
import { useEffect } from "react";
import { Obra } from "./types/supabase";
import CustomSidebar from "@/components/CustomSidebar";
import MasterAdminSidebar from "@/components/MasterAdminSidebar";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const masterAdminRoutes = ["/master-admin", "/formularios", "/base-de-dados"];

// --- NOVO COMPONENTE: Menu Mobile Lateral ---
const MobileSidebarTrigger = () => {
  const location = useLocation();
  const isMasterAdminPage = masterAdminRoutes.some((r) => location.pathname.startsWith(r));

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-primary hover:bg-slate-100 -ml-2">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-[85%] max-w-[300px] border-r-0 bg-primary">
        {/* Renderiza o Sidebar correto dentro do menu */}
        {isMasterAdminPage ? <MasterAdminSidebar /> : <CustomSidebar />}
      </SheetContent>
    </Sheet>
  );
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === "/auth" || location.pathname === "/reset-password";
  const isFormPage = location.pathname.startsWith("/form/");
  const isPortalParceiro = location.pathname === "/portal-parceiro";
  const isMasterAdminPage = masterAdminRoutes.includes(location.pathname);

  const isAppPage = !isAuthPage && !isFormPage && !isPortalParceiro;

  if (!isAppPage) {
    return (
      <div className="flex flex-col min-h-[100dvh] bg-background font-sans">
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    );
  }

  return (
    // Usa 100dvh para corrigir altura em mobile browsers
    <div className="flex h-[100dvh] overflow-hidden bg-background font-sans">
      {/* Sidebar Desktop (Só aparece em telas médias+) */}
      <div className="hidden md:flex h-full flex-shrink-0">
        {isMasterAdminPage ? <MasterAdminSidebar /> : <CustomSidebar />}
      </div>

      <div className="flex flex-col flex-1 w-full overflow-hidden relative">
        {/* Header Mobile: Fixo no topo */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-border shadow-sm z-30 flex-shrink-0 h-14">
          <span className="font-bold text-primary font-heading text-lg">GrifoBoard</span>
          <img src="/lovable-uploads/grifo-logo-header.png" className="h-6 w-auto" alt="Logo" />
        </div>

        {/* Conteúdo Principal com Scroll Nativo */}
        <main className="flex-1 overflow-y-auto w-full pb-20 md:pb-0 scroll-smooth bg-slate-50/50">
          <div className="p-3 md:p-6 max-w-[1600px] mx-auto w-full h-full">{children}</div>
        </main>

        {/* Navegação Inferior (App Dock) */}
        <MobileBottomNav />
      </div>
    </div>
  );
};

const RouteRestorer = () => {
  const { userSession } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (localStorage.getItem("logging_out") === "true") {
      sessionStorage.removeItem("lastRoute");
      return;
    }
    if (!userSession?.user) return;

    const excludedRoutes = ["/auth", "/reset-password", "/portal-parceiro", "/master-admin"];
    if (!excludedRoutes.includes(location.pathname)) {
      sessionStorage.setItem("lastRoute", location.pathname);
    }
  }, [location.pathname, userSession]);

  return null;
};

function App() {
  const handleObraSelect = (obra: Obra) => {};

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/form/profissionais" element={<FormProfissionais />} />
          <Route path="/form/empresas" element={<FormEmpresas />} />
          <Route path="/form/fornecedores" element={<FormFornecedores />} />

          <Route
            path="/*"
            element={
              <AuthProvider>
                <RouteGuard>
                  <RegistryProvider>
                    <RouteRestorer />
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Navigate to="/obras" replace />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/obras" element={<Obras onObraSelect={handleObraSelect} />} />
                        <Route path="/master-admin" element={<MasterAdmin />} />
                        <Route path="/formularios" element={<Formularios />} />
                        <Route path="/base-de-dados" element={<BaseDeDados />} />
                        <Route path="/playbook" element={<Playbook />} />
                        <Route path="/marketplace" element={<Marketplace />} />
                        <Route path="/grifoway" element={<GrifoWay />} />
                        <Route path="/grifo-ai" element={<GrifoAI />} />
                        <Route path="/gestao-metas" element={<GestaoMetas />} />
                        <Route path="/pmp" element={<PMP />} />
                        <Route path="/agenda" element={<Agenda />} /> {/* Nova Rota */}
                        <Route path="/portal-parceiro" element={<PortalParceiro />} />
                        <Route path="/tarefas" element={<Index onObraSelect={handleObraSelect} />} />
                        <Route path="/dashboard" element={<Index onObraSelect={handleObraSelect} />} />
                        <Route path="/diarioobra" element={<DiarioObra />} />
                        <Route path="/checklist" element={<Index onObraSelect={handleObraSelect} />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  </RegistryProvider>
                </RouteGuard>
              </AuthProvider>
            }
          />
        </Routes>
        <Toaster />
        <PWAUpdatePrompt />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
