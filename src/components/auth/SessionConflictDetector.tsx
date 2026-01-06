import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

const SessionConflictDetector = () => {
  const { userSession, signOut } = useAuth();
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictDetails, setConflictDetails] = useState<string>('');

  useEffect(() => {
    if (!userSession.user) return;

    const checkForConflicts = () => {
      const currentSessionId = localStorage.getItem('current_session_id');
      const storedSessionIds = JSON.parse(localStorage.getItem('all_session_ids') || '[]');
      
      // Check if there are multiple session IDs stored
      if (storedSessionIds.length > 1) {
        const otherSessions = storedSessionIds.filter((id: string) => id !== currentSessionId);
        if (otherSessions.length > 0) {
          setConflictDetails(`Detectadas ${otherSessions.length} sessões adicionais ativas.`);
          setShowConflictDialog(true);
        }
      }
    };

    // Initial check
    checkForConflicts();

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'current_session_id' && e.newValue && e.oldValue && e.newValue !== e.oldValue) {
        // Another tab/window just logged in with different session
        setConflictDetails('Nova sessão detectada em outra aba ou dispositivo.');
        setShowConflictDialog(true);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Periodic check for conflicts
    const interval = setInterval(checkForConflicts, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [userSession.user]);

  const handleForceLogout = async () => {
    setShowConflictDialog(false);
    await signOut();
  };

  if (!userSession.user) return null;

  return (
    <AlertDialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <AlertDialogTitle>Conflito de Sessão Detectado</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            {conflictDetails}
            {' '}
            Para evitar conflitos de dados e garantir a segurança da sua conta, 
            recomendamos que você faça logout e login novamente.
            {' '}
            <strong>Dados não salvos podem ser perdidos.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogAction
            onClick={handleForceLogout}
            className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
          >
            Fazer Logout Agora
          </AlertDialogAction>
          <AlertDialogAction
            onClick={() => setShowConflictDialog(false)}
            className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Continuar (Não Recomendado)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SessionConflictDetector;