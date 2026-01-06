import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Obra, UserSession } from "@/types/supabase";
import { toast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  userSession: UserSession;
  session: UserSession;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setObraAtiva: (obra: Obra | null) => void;
  setUserSession: (session: UserSession | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userSession, setUserSession] = useState<UserSession>({ user: null, obraAtiva: null });
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Generate unique session identifier
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Helper function to convert Supabase User to UserSession format
  const mapUser = (user: User | null): UserSession["user"] => {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email || "",
      user_metadata: user.user_metadata,
    };
  };

  // Session conflict detection disabled
  const handleSessionConflict = (currentSessionId: string) => {
    return false;
  };

  // Monitor user activity
  const updateActivity = () => {
    setLastActivity(Date.now());
    if (sessionId) {
      localStorage.setItem("last_activity", Date.now().toString());
    }
  };

  // Health check
  const checkSessionHealth = () => {
    if (!userSession.user || !sessionId) return;
  };

  // Retrieve obra ativa from localStorage
  const getInitialObraAtiva = (userId: string | undefined) => {
    if (!userId) return null;

    const savedObra = localStorage.getItem(`obraAtiva_${userId}`);
    if (savedObra) {
      try {
        return JSON.parse(savedObra);
      } catch (e) {
        localStorage.removeItem(`obraAtiva_${userId}`);
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    let healthCheckInterval: NodeJS.Timeout;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignora atualizações de estado se estivermos no processo de logout
      if (localStorage.getItem("logging_out") === "true") return;

      try {
        if (session && session.user) {
          const newSessionId = generateSessionId();
          setSessionId(newSessionId);

          if (!handleSessionConflict(newSessionId)) {
            localStorage.setItem("current_session_id", newSessionId);
            localStorage.setItem("last_activity", Date.now().toString());

            const obraAtiva = getInitialObraAtiva(session.user.id);
            setUserSession({ user: mapUser(session.user), obraAtiva });

            healthCheckInterval = setInterval(checkSessionHealth, 60000);
          }
        } else {
          setUserSession({ user: null, obraAtiva: null });
          setSessionId(null);

          ["current_session_id", "last_activity"].forEach((key) => {
            localStorage.removeItem(key);
          });

          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("obraAtiva_") || key.startsWith("user_")) {
              localStorage.removeItem(key);
            }
          });

          if (healthCheckInterval) {
            clearInterval(healthCheckInterval);
          }
        }
      } catch (error) {
        setUserSession({ user: null, obraAtiva: null });
        setSessionId(null);
      }

      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (localStorage.getItem("logging_out") === "true") {
        setIsLoading(false);
        return;
      }

      if (error) {
        if (error.message.includes("refresh_token_not_found") || error.message.includes("Invalid Refresh Token")) {
          localStorage.clear();
          setUserSession({ user: null, obraAtiva: null });
        }
      } else if (session?.user) {
        const newSessionId = generateSessionId();
        setSessionId(newSessionId);
        localStorage.setItem("current_session_id", newSessionId);

        const obraAtiva = getInitialObraAtiva(session.user.id);
        setUserSession({ user: mapUser(session.user), obraAtiva });
      }
      setIsLoading(false);
    });

    const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];
    const handleActivity = () => updateActivity();

    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      subscription.unsubscribe();
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
      }
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      localStorage.removeItem("current_session_id");
      localStorage.removeItem("last_activity");

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          throw new Error("Por favor, confirme seu email antes de fazer login.");
        } else if (error.message.includes("Invalid login credentials")) {
          throw new Error("Email ou senha incorretos.");
        } else {
          throw error;
        }
      }

      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo de volta!",
      });
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      if (data?.session) {
        toast({
          title: "Conta criada",
          description: "Bem-vindo!",
        });
      } else {
        toast({
          title: "Cadastro iniciado",
          description: `Enviamos um email de confirmação para ${email}. Verifique sua caixa de entrada e o spam.`,
        });
      }
    } catch (error: any) {
      const msg = typeof error?.message === "string" ? error.message : String(error);
      let friendly = msg;
      if (msg.includes("over_email_send_rate_limit") || msg.includes("request this after")) {
        friendly = "Por segurança, aguarde alguns segundos antes de tentar novamente.";
      } else if (msg.toLowerCase().includes("already registered")) {
        friendly = "Já existe uma conta para este email. Tente fazer login ou recuperar a senha.";
      }
      toast({
        title: "Erro no cadastro",
        description: friendly,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      const redirectUrl = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar email",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // --- SOLUÇÃO DEFINITIVA DO LOGOUT ---
  const signOut = async () => {
    try {
      // 1. Define flag CRÍTICA para parar RouteGuard e Listeners
      localStorage.setItem("logging_out", "true");

      // 2. NÃO ATIVE O LOADING! Isso causa a tela branca.
      // setIsLoading(true); <--- REMOVIDO

      // 3. Limpa storage (Session e Local) para garantir que nada sobra
      sessionStorage.clear(); // Remove lastRoute e outros lixos

      const currentUserId = userSession.user?.id;
      // NÃO limpe o userSession aqui. Deixe a UI congelada com os dados antigos
      // setUserSession({ user: null, obraAtiva: null }); <--- REMOVIDO

      // Limpeza manual de chaves específicas
      ["current_session_id", "last_activity"].forEach((key) => {
        localStorage.removeItem(key);
      });

      if (currentUserId) {
        localStorage.removeItem(`obraAtiva_${currentUserId}`);
      }

      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("obraAtiva_") || key.startsWith("user_")) {
          localStorage.removeItem(key);
        }
      });

      // 4. Logout no Supabase (Backend)
      await supabase.auth.signOut({ scope: "global" });
    } catch (error: any) {
      console.error("Erro no logout:", error);
      // Mesmo com erro, forçamos a flag para garantir a saída
      localStorage.setItem("logging_out", "true");
    } finally {
      // 5. REDIRECIONAMENTO AGRESSIVO
      // Usa replace para limpar histórico e força o refresh da página
      // O refresh vai inicializar o AuthContext do zero, limpo e bonito.
      window.location.replace("/auth");
    }
  };

  const setObraAtiva = (obra: Obra | null) => {
    setUserSession((prev) => {
      const newSession = prev ? { ...prev, obraAtiva: obra } : { user: null, obraAtiva: null };
      if (prev?.user && obra) {
        localStorage.setItem(`obraAtiva_${prev.user.id}`, JSON.stringify(obra));
      } else if (prev?.user) {
        localStorage.removeItem(`obraAtiva_${prev.user.id}`);
      }
      return newSession;
    });
  };

  const value = {
    userSession,
    session: userSession,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    setObraAtiva,
    setUserSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
