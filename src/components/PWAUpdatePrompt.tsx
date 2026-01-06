import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      console.log('SW registrado:', swUrl);
      // Verifica atualizações a cada 60 segundos
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('Erro ao registrar SW:', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      toast({
        title: "Nova versão disponível!",
        description: "Clique aqui para atualizar o app",
        variant: "gold",
        duration: Infinity,
        action: (
          <button
            onClick={() => {
              updateServiceWorker(true);
              setNeedRefresh(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
        ),
      });
    }
  }, [needRefresh, updateServiceWorker, setNeedRefresh]);

  return null;
}
