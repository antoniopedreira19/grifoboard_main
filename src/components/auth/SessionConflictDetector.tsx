import { useEffect, useState, useRef } from 'react';
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

/**
 * SessionConflictDetector - Detects when the user's session is invalidated
 * by a logout in another tab/window (same browser).
 * 
 * NOTE: Multiple tabs in the same browser share the same session and should
 * NOT be treated as conflicts. This component only detects actual logout events.
 */
const SessionConflictDetector = () => {
  const { userSession, signOut } = useAuth();
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const wasLoggedInRef = useRef(false);

  useEffect(() => {
    // Track if user was logged in
    if (userSession?.user) {
      wasLoggedInRef.current = true;
    }
  }, [userSession?.user]);

  useEffect(() => {
    // Listen for logout events from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      // Detect when user logs out in another tab
      if (e.key === 'supabase.auth.token' && e.newValue === null && wasLoggedInRef.current) {
        // Session was cleared in another tab
        setShowConflictDialog(true);
      }
      
      // Also detect explicit logout signal
      if (e.key === 'logout_event' && e.newValue) {
        setShowConflictDialog(true);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleForceLogout = async () => {
    setShowConflictDialog(false);
    await signOut();
  };

  const handleContinue = () => {
    setShowConflictDialog(false);
    // Refresh the page to get latest auth state
    window.location.reload();
  };

  if (!showConflictDialog) return null;

  return (
    <AlertDialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <AlertDialogTitle>Sessão Encerrada</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            Sua sessão foi encerrada em outra aba ou janela.
            Por favor, faça login novamente para continuar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogAction
            onClick={handleForceLogout}
            className="bg-grifo-secondary hover:bg-grifo-secondary/90 text-white w-full sm:w-auto"
          >
            Ir para Login
          </AlertDialogAction>
          <AlertDialogAction
            onClick={handleContinue}
            className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Atualizar Página
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SessionConflictDetector;