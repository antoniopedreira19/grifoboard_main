import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface CompanyUser {
  id: string;
  nome: string | null;
  email: string | null;
}

export const useCompanyUsers = () => {
  const { userSession } = useAuth();
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyUsers = async () => {
      if (!userSession?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Primeiro, busca o empresa_id do usuário atual
        const { data: currentUser, error: userError } = await supabase
          .from("usuarios")
          .select("empresa_id")
          .eq("id", userSession.user.id)
          .maybeSingle();

        if (userError || !currentUser?.empresa_id) {
          setIsLoading(false);
          return;
        }

        // Depois, busca todos os usuários da mesma empresa
        const { data: usersData, error: usersError } = await supabase
          .from("usuarios")
          .select("id, nome, email")
          .eq("empresa_id", currentUser.empresa_id)
          .order("nome", { ascending: true });

        if (usersError) {
          console.error("Erro ao buscar usuários:", usersError);
          setIsLoading(false);
          return;
        }

        setUsers(usersData || []);
      } catch (error) {
        console.error("Erro ao buscar usuários da empresa:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyUsers();
  }, [userSession?.user?.id]);

  return { users, isLoading };
};
