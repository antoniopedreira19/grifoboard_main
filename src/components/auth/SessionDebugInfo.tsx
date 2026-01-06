import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  RefreshCw, 
  Shield, 
  Clock, 
  User,
  Database,
  AlertCircle
} from 'lucide-react';

interface SessionInfo {
  sessionId: string | null;
  userId: string | null;
  email: string | null;
  lastActivity: string;
  timeSinceActivity: string;
  obraAtiva: string | null;
  isActive: boolean;
}

const SessionDebugInfo = () => {
  const { userSession } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

  const updateSessionInfo = () => {
    const currentSessionId = localStorage.getItem('current_session_id');
    const lastActivity = localStorage.getItem('last_activity');
    const lastActivityTime = lastActivity ? parseInt(lastActivity, 10) : null;
    
    const timeSinceActivity = lastActivityTime 
      ? Math.floor((Date.now() - lastActivityTime) / 1000 / 60) // minutes
      : 0;

    const info: SessionInfo = {
      sessionId: currentSessionId,
      userId: userSession.user?.id || null,
      email: userSession.user?.email || null,
      lastActivity: lastActivityTime 
        ? new Date(lastActivityTime).toLocaleTimeString() 
        : 'N/A',
      timeSinceActivity: timeSinceActivity < 1 
        ? 'Menos de 1 min' 
        : `${timeSinceActivity} min atrás`,
      obraAtiva: userSession.obraAtiva?.nome_obra || null,
      isActive: timeSinceActivity < 30 // Less than 30 minutes is considered active
    };

    setSessionInfo(info);
  };

  useEffect(() => {
    if (userSession.user) {
      updateSessionInfo();
      
      // Update every 30 seconds
      const interval = setInterval(updateSessionInfo, 30000);
      
      return () => clearInterval(interval);
    } else {
      setSessionInfo(null);
    }
  }, [userSession]);

  const handleRefresh = () => {
    updateSessionInfo();
  };

  const clearSessionData = () => {
    localStorage.removeItem('current_session_id');
    localStorage.removeItem('last_activity');
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('obraAtiva_')) {
        localStorage.removeItem(key);
      }
    });
    updateSessionInfo();
  };

  if (!userSession.user || !sessionInfo) return null;

  // Only show in development or when specifically enabled
  const showDebug = process.env.NODE_ENV === 'development' || 
                   localStorage.getItem('show_session_debug') === 'true';

  if (!showDebug) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white shadow-lg border-gray-300"
          >
            <Shield className="h-4 w-4 mr-2" />
            Debug Sessão
            <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2">
          <Card className="w-80 bg-white shadow-lg border-gray-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Informações da Sessão
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                  <Badge 
                    variant={sessionInfo.isActive ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {sessionInfo.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="flex items-center text-gray-600">
                    <User className="h-3 w-3 mr-1" />
                    Usuário
                  </div>
                  <div className="font-mono text-[10px] bg-gray-50 p-1 rounded">
                    {sessionInfo.email}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center text-gray-600">
                    <Database className="h-3 w-3 mr-1" />
                    Obra Ativa
                  </div>
                  <div className="font-mono text-[10px] bg-gray-50 p-1 rounded truncate">
                    {sessionInfo.obraAtiva || 'Nenhuma'}
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center text-gray-600">
                  <Shield className="h-3 w-3 mr-1" />
                  Session ID
                </div>
                <div className="font-mono text-[10px] bg-gray-50 p-1 rounded break-all">
                  {sessionInfo.sessionId?.substring(0, 20)}...
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-3 w-3 mr-1" />
                    Última Atividade
                  </div>
                  <div className="text-[10px] bg-gray-50 p-1 rounded">
                    {sessionInfo.lastActivity}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center text-gray-600">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Inatividade
                  </div>
                  <div className="text-[10px] bg-gray-50 p-1 rounded">
                    {sessionInfo.timeSinceActivity}
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSessionData}
                  className="w-full text-xs h-6"
                >
                  Limpar Dados de Sessão
                </Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default SessionDebugInfo;