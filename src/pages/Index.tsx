import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Obra } from "@/types/supabase";
import { useAuth } from "@/context/AuthContext";
import { useSafeRegistry } from "@/context/RegistryContext";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import MainPageContent from "@/components/MainPageContent";
import DashboardContent from "@/components/DashboardContent";
import ChecklistContent from "@/components/ChecklistContent";
import SessionMonitor from "@/components/SessionMonitor";
import SessionConflictDetector from "@/components/auth/SessionConflictDetector";
import SessionDebugInfo from "@/components/auth/SessionDebugInfo";

interface IndexProps {
  onObraSelect: (obra: Obra) => void;
}

const Index = ({ onObraSelect }: IndexProps) => {
  const { userSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const registry = useSafeRegistry();
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  // Enable session timeout management
  useSessionTimeout({
    timeoutMinutes: 30, // 30 minutes of inactivity
    warningMinutes: 5, // Show warning 5 minutes before expiry
  });

  // Determine which content to render based on the current route
  const isDashboard = location.pathname === "/dashboard";
  const isChecklist = location.pathname === "/checklist";

  // Show message when no obra is selected instead of redirecting
  useEffect(() => {
    if (userSession?.obraAtiva && registry?.setSelectedObraId) {
      registry.setSelectedObraId(userSession.obraAtiva.id);
      onObraSelect(userSession.obraAtiva);
    }
  }, [userSession?.obraAtiva, registry, onObraSelect]);

  // Only redirect to auth if no user
  if (!userSession?.user) {
    if (!redirectAttempted) {
      navigate("/auth");
      setRedirectAttempted(true);
    }
    return null;
  }

  // If no active obra, show a message instead of redirecting
  if (!userSession.obraAtiva) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center space-y-4 p-8 bg-white rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800">Nenhuma obra selecionada</h2>
          <p className="text-slate-600">Selecione uma obra para continuar.</p>
          <button
            onClick={() => navigate("/obras")}
            className="px-6 py-3 bg-[#C7A347] text-white rounded-xl font-semibold hover:bg-[#B7943F] transition-colors"
          >
            Selecionar Obra
          </button>
        </div>
      </div>
    );
  }

  // Render the appropriate content based on the current route
  if (isDashboard) {
    return (
      <>
        <SessionMonitor />
        <SessionConflictDetector />
        <SessionDebugInfo />
        <DashboardContent />
      </>
    );
  } else if (isChecklist) {
    return (
      <>
        <SessionMonitor />
        <SessionConflictDetector />
        <SessionDebugInfo />
        <ChecklistContent />
      </>
    );
  } else {
    return (
      <>
        <SessionMonitor />
        <SessionConflictDetector />
        <SessionDebugInfo />
        <MainPageContent />
      </>
    );
  }
};

export default Index;
