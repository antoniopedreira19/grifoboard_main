import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
interface SessionInfo {
  id: string;
  lastActivity: number;
  isCurrentSession: boolean;
}
const SessionMonitor = () => {
  const {
    userSession
  } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [showSessionAlert, setShowSessionAlert] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'active' | 'conflict' | 'expired'>('active');
  useEffect(() => {
    if (!userSession.user) return;
    
    let lastCheckTime = 0;
    const CHECK_COOLDOWN = 30000; // 30 second cooldown to minimize checks
    
    const checkSessionStatus = () => {
      const now = Date.now();
      if (now - lastCheckTime < CHECK_COOLDOWN) return; // Skip if checked recently
      lastCheckTime = now;
      
      const currentSessionId = localStorage.getItem('current_session_id');
      const lastActivity = localStorage.getItem('last_activity');
      if (currentSessionId && lastActivity) {
        const info: SessionInfo = {
          id: currentSessionId,
          lastActivity: parseInt(lastActivity, 10),
          isCurrentSession: true
        };
        
        const timeSinceActivity = Date.now() - info.lastActivity;
        const thirtyMinutes = 30 * 60 * 1000;
        const fiveMinutes = 5 * 60 * 1000;
        
        let newStatus: 'active' | 'conflict' | 'expired' = 'active';
        let newShowAlert = false;
        
        if (timeSinceActivity > thirtyMinutes) {
          newStatus = 'expired';
          newShowAlert = true;
        } else if (timeSinceActivity > thirtyMinutes - fiveMinutes) {
          newStatus = 'active';
          newShowAlert = true;
        }
        
        // Only update state if values actually changed to prevent re-renders
        setSessionInfo(prev => {
          if (!prev || prev.id !== info.id || prev.lastActivity !== info.lastActivity) {
            return info;
          }
          return prev;
        });
        
        setSessionStatus(prev => prev !== newStatus ? newStatus : prev);
        setShowSessionAlert(prev => prev !== newShowAlert ? newShowAlert : prev);
      }
    };

    // Check immediately only once
    checkSessionStatus();

    // Reduce check frequency to every 5 minutes for performance
    const interval = setInterval(checkSessionStatus, 300000);

    // Only listen for direct storage changes, not visibility changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'current_session_id' || e.key === 'last_activity') {
        // Debounce storage change handling
        setTimeout(checkSessionStatus, 100);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userSession.user]);
  const formatTimeAgo = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'agora mesmo';
    if (minutes === 1) return '1 minuto atrás';
    return `${minutes} minutos atrás`;
  };
  const getSessionStatusIcon = () => {
    switch (sessionStatus) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'conflict':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-red-600" />;
      default:
        return <Shield className="h-4 w-4 text-blue-600" />;
    }
  };
  const getSessionStatusText = () => {
    switch (sessionStatus) {
      case 'active':
        return 'Sessão ativa';
      case 'conflict':
        return 'Conflito de sessão detectado';
      case 'expired':
        return 'Sessão expirou';
      default:
        return 'Status da sessão';
    }
  };
  if (!userSession.user || !sessionInfo) return null;
  return <div className="space-y-2">
      {/* Session Status Indicator (always visible for logged users) */}
      

      {/* Session Alerts */}
      {showSessionAlert && sessionStatus === 'expired' && <Alert variant="destructive" className="mb-4">
          <Clock className="h-4 w-4" />
          <AlertTitle>Sessão Expirada</AlertTitle>
          <AlertDescription>
            Sua sessão expirou devido à inatividade. Faça login novamente para continuar.
          </AlertDescription>
        </Alert>}

      {showSessionAlert && sessionStatus === 'active' && <Alert className="mb-4 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Aviso de Sessão</AlertTitle>
          <AlertDescription className="text-orange-700">
            Sua sessão expirará em breve devido à inatividade. Clique em qualquer lugar para renovar.
          </AlertDescription>
        </Alert>}

      {showSessionAlert && sessionStatus === 'conflict' && <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Múltiplas Sessões Detectadas</AlertTitle>
          <AlertDescription>
            Foi detectado um login em outro dispositivo ou janela. Você será desconectado automaticamente para evitar conflitos de dados.
          </AlertDescription>
        </Alert>}
    </div>;
};
export default SessionMonitor;