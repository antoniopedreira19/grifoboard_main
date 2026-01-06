import { supabase } from '@/lib/supabase';

export interface EmpresaStats {
  id: string;
  nome: string;
  created_at: string;
  total_obras: number;
  ultimo_login: string | null;
  total_usuarios: number;
}

export const masterAdminService = {
  async getEmpresasStats(): Promise<EmpresaStats[]> {
    const { data, error } = await supabase.rpc('get_empresas_stats');
    
    if (error) {
      console.error('Error fetching empresas stats:', error);
      throw error;
    }
    
    return data || [];
  },

  async isMasterAdmin(): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_master_admin');
    
    if (error) {
      console.error('Error checking master admin status:', error);
      return false;
    }
    
    return data || false;
  }
};
