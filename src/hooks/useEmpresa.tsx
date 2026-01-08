import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface EmpresaInfo {
  id: string;
  nome: string;
}

export const useEmpresa = () => {
  const { userSession } = useAuth();
  const [empresa, setEmpresa] = useState<EmpresaInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEmpresa = async () => {
      if (!userSession?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Primeiro, busca o empresa_id do usuário na tabela usuarios
        const { data: usuarioData, error: usuarioError } = await supabase
          .from("usuarios")
          .select("empresa_id")
          .eq("id", userSession.user.id)
          .maybeSingle();

        if (usuarioError || !usuarioData?.empresa_id) {
          setIsLoading(false);
          return;
        }

        // Depois, busca o nome da empresa
        const { data: empresaData, error: empresaError } = await supabase
          .from("empresas")
          .select("id, nome")
          .eq("id", usuarioData.empresa_id)
          .maybeSingle();

        if (empresaError || !empresaData) {
          setIsLoading(false);
          return;
        }

        setEmpresa(empresaData);
      } catch (error) {
        console.error("Erro ao buscar empresa:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmpresa();
  }, [userSession?.user?.id]);

  return { empresa, isLoading };
};
