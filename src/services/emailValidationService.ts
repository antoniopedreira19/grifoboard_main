import { supabase } from "@/integrations/supabase/client";

export type EmailValidationResult = {
  exists: boolean;
  source: string | null;
};

/**
 * Verifica se um email já existe em qualquer tabela do sistema
 * Usa uma função RPC do Supabase para bypass de RLS
 * Tabelas verificadas: usuarios, formulario_profissionais, formulario_empresas, formulario_fornecedores
 */
export const checkEmailExistsGlobal = async (email: string): Promise<EmailValidationResult> => {
  const normalizedEmail = email.toLowerCase().trim();
  
  const { data, error } = await supabase.rpc('check_email_exists_global', {
    email_to_check: normalizedEmail
  });
  
  if (error) {
    console.error("Erro ao verificar email:", error);
    return { exists: false, source: null };
  }
  
  if (data) {
    return { exists: true, source: data };
  }
  
  return { exists: false, source: null };
};
