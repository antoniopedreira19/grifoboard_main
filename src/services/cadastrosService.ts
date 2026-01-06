import { supabase } from "@/integrations/supabase/client";

// --- PROFISSIONAIS ---
export interface ProfissionalPayload {
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  cidade: string;
  estado: string;
  funcao_principal: string;
  funcao_principal_outro?: string | null;
  especialidades: string[];
  especialidades_outro?: string | null;
  tempo_experiencia: string;
  obras_relevantes?: string | null;
  disponibilidade_atual: string;
  modalidade_trabalho: string;
  regioes_atendidas: string[];
  cidades_frequentes?: string | null;
  pretensao_valor: string;
  equipamentos_proprios: string;
  diferenciais: string[];
  diferenciais_outro?: string | null;
  telefone: string;
  email?: string | null;

  // Arquivos
  logo_path?: string | null;
  fotos_trabalhos_path?: string | null;
  curriculo_path?: string | null;
  certificacoes_path?: string | null;

  // Novo Campo
  ja_trabalhou_com_grifo?: boolean;
}

// --- FORNECEDORES (Atualizado) ---
export interface FornecedorPayload {
  nome_empresa: string;
  cnpj_cpf: string;
  site?: string | null;
  cidade: string;
  estado: string;
  tempo_atuacao: string;
  tipos_atuacao: string[];
  tipo_atuacao_outro?: string | null;
  categorias_atendidas: string[];
  categorias_outro?: string | null;
  ticket_medio: string;
  capacidade_atendimento: string;
  regioes_atendidas: string[];
  cidades_frequentes?: string | null;
  diferenciais: string[];
  diferenciais_outro?: string | null;
  nome_responsavel: string;
  telefone: string;
  email: string;

  // Arquivos
  logo_path?: string | null;
  portfolio_path?: string | null; // Para Catálogos/PDFs
  certificacoes_path?: string | null; // Para Documentos
  fotos_trabalhos_path?: string | null; // Para fotos reais

  // Novo Campo
  ja_trabalhou_com_grifo?: boolean;
}

// --- EMPRESAS ---
export interface EmpresaPayload {
  nome_empresa: string;
  cnpj: string;
  site?: string | null;
  cidade: string;
  estado: string;
  ano_fundacao: string;
  tamanho_empresa: string;
  nome_contato: string;
  cargo_contato: string;
  whatsapp_contato: string;
  email_contato: string;
  obras_andamento: string;
  tipos_obras: string[];
  tipos_obras_outro?: string | null;
  ticket_medio: string;
  planejamento_curto_prazo: string;
  ferramentas_gestao?: string | null;
  principais_desafios: string[];
  desafios_outro?: string | null;

  // Arquivos
  logo_path?: string | null;
  apresentacao_path?: string | null;

  // Novo Campo
  ja_trabalhou_com_grifo?: boolean;
}

export const cadastrosService = {
  async createProfissional(data: ProfissionalPayload) {
    const { error } = await supabase.from("formulario_profissionais").insert(data);
    if (error) throw error;
  },

  async createFornecedor(data: FornecedorPayload) {
    const { error } = await supabase.from("formulario_fornecedores").insert(data);
    if (error) throw error;
  },

  async createEmpresa(data: EmpresaPayload) {
    const { error } = await supabase.from("formulario_empresas").insert(data);
    if (error) throw error;
  },
};
