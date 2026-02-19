import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

// Rotas permitidas para parceiros
const parceiroAllowedRoutes = ["/portal-parceiro", "/auth", "/reset-password"];

// Rotas públicas (formulários e páginas que não exigem login)
const publicRoutes = ["/form/profissionais", "/form/empresas", "/form/fornecedores"];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { userSession, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      // 0. Se o AuthContext ainda está carregando, espera.
      if (authLoading) return;

      // 1. Se logout está em progresso (flag do AuthContext), para tudo.
      if (localStorage.getItem("logging_out") === "true") {
        setChecking(false); // Ou true se quiser manter o loader
        return;
      }

      const currentPath = location.pathname;

      // 2. Rotas Públicas (Formulários externos)
      // Permite acesso direto sem verificar sessão
      if (publicRoutes.some((route) => currentPath.startsWith(route))) {
        setChecking(false);
        return;
      }

      // 3. Usuário NÃO Logado
      if (!userSession?.user) {
        // Se não está na página de login ou reset, manda para login
        if (currentPath !== "/auth" && currentPath !== "/reset-password") {
          console.log("Acesso negado: Sem sessão. Redirecionando para /auth");
          setChecking(false);
          navigate("/auth", { replace: true });
          return;
        }
        // Se já está no login, permite renderizar
        setChecking(false);
        return;
      }

      // 4. Usuário LOGADO
      // Se tentar acessar a página de login estando logado, manda para o dashboard
      if (currentPath === "/auth") {
        setChecking(false);
        navigate("/obras", { replace: true });
        return;
      }

      // 5. Verificação de Role (RBAC)
      try {
        const { data, error } = await supabase.from("usuarios").select("role").eq("id", userSession.user.id).single();

        if (error) {
          console.error("Erro ao buscar role:", error);
          // Em caso de erro crítico, deixa passar ou bloqueia?
          // Aqui deixamos passar para evitar bloqueio total, mas idealmente trataria o erro.
          setChecking(false);
          return;
        }

        const role = data?.role;

        // Regra do Parceiro
        if (role === "parceiro" && !parceiroAllowedRoutes.includes(currentPath)) {
          setChecking(false);
          navigate("/portal-parceiro", { replace: true });
          return;
        }

        // Regra do Usuário Comum (não pode acessar portal parceiro)
        if (role !== "parceiro" && currentPath === "/portal-parceiro") {
          setChecking(false);
          navigate("/obras", { replace: true });
          return;
        }

        // Tudo certo
        setChecking(false);
      } catch (err) {
        console.error("Erro na verificação de role:", err);
        setChecking(false);
      }
    };

    checkAccess();
  }, [userSession, authLoading, location.pathname, navigate]);

  // Exibe loader enquanto carrega o AuthContext ou enquanto verifica as permissões (checking)
  if (authLoading || checking) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
