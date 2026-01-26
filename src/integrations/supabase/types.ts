export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      agenda_events: {
        Row: {
          anexo_url: string | null
          category: string | null
          completed: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          obra_id: string
          participants: string[] | null
          resumo: string | null
          start_date: string
          title: string
        }
        Insert: {
          anexo_url?: string | null
          category?: string | null
          completed?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          obra_id: string
          participants?: string[] | null
          resumo?: string | null
          start_date: string
          title: string
        }
        Update: {
          anexo_url?: string | null
          category?: string | null
          completed?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          obra_id?: string
          participants?: string[] | null
          resumo?: string | null
          start_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_events_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades_checklist: {
        Row: {
          concluida: boolean
          created_at: string
          data_inicio: string | null
          data_termino: string | null
          descricao: string | null
          id: string
          local: string
          obra_id: string
          responsavel: string
          setor: string
          updated_at: string
        }
        Insert: {
          concluida?: boolean
          created_at?: string
          data_inicio?: string | null
          data_termino?: string | null
          descricao?: string | null
          id?: string
          local: string
          obra_id: string
          responsavel: string
          setor: string
          updated_at?: string
        }
        Update: {
          concluida?: boolean
          created_at?: string
          data_inicio?: string | null
          data_termino?: string | null
          descricao?: string | null
          id?: string
          local?: string
          obra_id?: string
          responsavel?: string
          setor?: string
          updated_at?: string
        }
        Relationships: []
      }
      diario_fotos: {
        Row: {
          criado_em: string
          criado_por: string
          data: string
          id: string
          legenda: string | null
          obra_id: string
          path: string
        }
        Insert: {
          criado_em?: string
          criado_por: string
          data: string
          id?: string
          legenda?: string | null
          obra_id: string
          path: string
        }
        Update: {
          criado_em?: string
          criado_por?: string
          data?: string
          id?: string
          legenda?: string | null
          obra_id?: string
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "diario_fotos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      diarios_obra: {
        Row: {
          atividades: string
          clima: string | null
          created_at: string
          created_by: string
          data: string
          equipamentos: string | null
          id: string
          mao_de_obra: string | null
          obra_id: string
          observacoes: string | null
          ocorrencias: string | null
          updated_at: string
        }
        Insert: {
          atividades: string
          clima?: string | null
          created_at?: string
          created_by: string
          data: string
          equipamentos?: string | null
          id?: string
          mao_de_obra?: string | null
          obra_id: string
          observacoes?: string | null
          ocorrencias?: string | null
          updated_at?: string
        }
        Update: {
          atividades?: string
          clima?: string | null
          created_at?: string
          created_by?: string
          data?: string
          equipamentos?: string | null
          id?: string
          mao_de_obra?: string | null
          obra_id?: string
          observacoes?: string | null
          ocorrencias?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diarios_obra_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      empresas: {
        Row: {
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      formulario_empresas: {
        Row: {
          ano_fundacao: string
          apresentacao_path: string | null
          cargo_contato: string
          cidade: string
          cnpj: string
          created_at: string | null
          desafios_outro: string | null
          email_contato: string
          estado: string
          ferramentas_gestao: string | null
          id: string
          ja_trabalhou_com_grifo: boolean | null
          logo_path: string | null
          nome_contato: string
          nome_empresa: string
          obras_andamento: string
          planejamento_curto_prazo: string
          principais_desafios: string[]
          selo_grifo: boolean | null
          site: string | null
          tamanho_empresa: string
          ticket_medio: string
          tipos_obras: string[]
          tipos_obras_outro: string | null
          user_id: string | null
          whatsapp_contato: string
        }
        Insert: {
          ano_fundacao: string
          apresentacao_path?: string | null
          cargo_contato: string
          cidade: string
          cnpj: string
          created_at?: string | null
          desafios_outro?: string | null
          email_contato: string
          estado: string
          ferramentas_gestao?: string | null
          id?: string
          ja_trabalhou_com_grifo?: boolean | null
          logo_path?: string | null
          nome_contato: string
          nome_empresa: string
          obras_andamento: string
          planejamento_curto_prazo: string
          principais_desafios: string[]
          selo_grifo?: boolean | null
          site?: string | null
          tamanho_empresa: string
          ticket_medio: string
          tipos_obras: string[]
          tipos_obras_outro?: string | null
          user_id?: string | null
          whatsapp_contato: string
        }
        Update: {
          ano_fundacao?: string
          apresentacao_path?: string | null
          cargo_contato?: string
          cidade?: string
          cnpj?: string
          created_at?: string | null
          desafios_outro?: string | null
          email_contato?: string
          estado?: string
          ferramentas_gestao?: string | null
          id?: string
          ja_trabalhou_com_grifo?: boolean | null
          logo_path?: string | null
          nome_contato?: string
          nome_empresa?: string
          obras_andamento?: string
          planejamento_curto_prazo?: string
          principais_desafios?: string[]
          selo_grifo?: boolean | null
          site?: string | null
          tamanho_empresa?: string
          ticket_medio?: string
          tipos_obras?: string[]
          tipos_obras_outro?: string | null
          user_id?: string | null
          whatsapp_contato?: string
        }
        Relationships: []
      }
      formulario_fornecedores: {
        Row: {
          capacidade_atendimento: string
          categorias_atendidas: string[]
          categorias_outro: string | null
          certificacoes_path: string | null
          cidade: string
          cidades_frequentes: string | null
          cnpj_cpf: string
          created_at: string | null
          diferenciais: string[]
          diferenciais_outro: string | null
          email: string
          estado: string
          fotos_trabalhos_path: string | null
          id: string
          ja_trabalhou_com_grifo: boolean | null
          logo_path: string | null
          nome_empresa: string
          nome_responsavel: string
          portfolio_path: string | null
          regioes_atendidas: string[]
          selo_grifo: boolean | null
          site: string | null
          telefone: string
          tempo_atuacao: string
          ticket_medio: string
          tipo_atuacao_outro: string | null
          tipos_atuacao: string[]
          user_id: string | null
        }
        Insert: {
          capacidade_atendimento: string
          categorias_atendidas: string[]
          categorias_outro?: string | null
          certificacoes_path?: string | null
          cidade: string
          cidades_frequentes?: string | null
          cnpj_cpf: string
          created_at?: string | null
          diferenciais: string[]
          diferenciais_outro?: string | null
          email: string
          estado: string
          fotos_trabalhos_path?: string | null
          id?: string
          ja_trabalhou_com_grifo?: boolean | null
          logo_path?: string | null
          nome_empresa: string
          nome_responsavel: string
          portfolio_path?: string | null
          regioes_atendidas: string[]
          selo_grifo?: boolean | null
          site?: string | null
          telefone: string
          tempo_atuacao: string
          ticket_medio: string
          tipo_atuacao_outro?: string | null
          tipos_atuacao: string[]
          user_id?: string | null
        }
        Update: {
          capacidade_atendimento?: string
          categorias_atendidas?: string[]
          categorias_outro?: string | null
          certificacoes_path?: string | null
          cidade?: string
          cidades_frequentes?: string | null
          cnpj_cpf?: string
          created_at?: string | null
          diferenciais?: string[]
          diferenciais_outro?: string | null
          email?: string
          estado?: string
          fotos_trabalhos_path?: string | null
          id?: string
          ja_trabalhou_com_grifo?: boolean | null
          logo_path?: string | null
          nome_empresa?: string
          nome_responsavel?: string
          portfolio_path?: string | null
          regioes_atendidas?: string[]
          selo_grifo?: boolean | null
          site?: string | null
          telefone?: string
          tempo_atuacao?: string
          ticket_medio?: string
          tipo_atuacao_outro?: string | null
          tipos_atuacao?: string[]
          user_id?: string | null
        }
        Relationships: []
      }
      formulario_profissionais: {
        Row: {
          certificacoes_path: string | null
          cidade: string
          cidades_frequentes: string | null
          cpf: string
          created_at: string | null
          curriculo_path: string | null
          data_nascimento: string
          diferenciais: string[]
          diferenciais_outro: string | null
          disponibilidade_atual: string
          email: string | null
          equipamentos_proprios: string
          especialidades: string[]
          especialidades_outro: string | null
          estado: string
          fotos_trabalhos_path: string | null
          funcao_principal: string
          funcao_principal_outro: string | null
          id: string
          ja_trabalhou_com_grifo: boolean | null
          logo_path: string | null
          modalidade_trabalho: string
          nome_completo: string
          obras_relevantes: string | null
          pretensao_valor: string
          regioes_atendidas: string[]
          selo_grifo: boolean | null
          telefone: string
          tempo_experiencia: string
          user_id: string | null
        }
        Insert: {
          certificacoes_path?: string | null
          cidade: string
          cidades_frequentes?: string | null
          cpf: string
          created_at?: string | null
          curriculo_path?: string | null
          data_nascimento: string
          diferenciais: string[]
          diferenciais_outro?: string | null
          disponibilidade_atual: string
          email?: string | null
          equipamentos_proprios: string
          especialidades: string[]
          especialidades_outro?: string | null
          estado: string
          fotos_trabalhos_path?: string | null
          funcao_principal: string
          funcao_principal_outro?: string | null
          id?: string
          ja_trabalhou_com_grifo?: boolean | null
          logo_path?: string | null
          modalidade_trabalho: string
          nome_completo: string
          obras_relevantes?: string | null
          pretensao_valor: string
          regioes_atendidas: string[]
          selo_grifo?: boolean | null
          telefone: string
          tempo_experiencia: string
          user_id?: string | null
        }
        Update: {
          certificacoes_path?: string | null
          cidade?: string
          cidades_frequentes?: string | null
          cpf?: string
          created_at?: string | null
          curriculo_path?: string | null
          data_nascimento?: string
          diferenciais?: string[]
          diferenciais_outro?: string | null
          disponibilidade_atual?: string
          email?: string | null
          equipamentos_proprios?: string
          especialidades?: string[]
          especialidades_outro?: string | null
          estado?: string
          fotos_trabalhos_path?: string | null
          funcao_principal?: string
          funcao_principal_outro?: string | null
          id?: string
          ja_trabalhou_com_grifo?: boolean | null
          logo_path?: string | null
          modalidade_trabalho?: string
          nome_completo?: string
          obras_relevantes?: string | null
          pretensao_valor?: string
          regioes_atendidas?: string[]
          selo_grifo?: boolean | null
          telefone?: string
          tempo_experiencia?: string
          user_id?: string | null
        }
        Relationships: []
      }
      gamification_logs: {
        Row: {
          action_type: string | null
          created_at: string | null
          id: string
          reference_id: string | null
          user_id: string | null
          xp_amount: number | null
        }
        Insert: {
          action_type?: string | null
          created_at?: string | null
          id?: string
          reference_id?: string | null
          user_id?: string | null
          xp_amount?: number | null
        }
        Update: {
          action_type?: string | null
          created_at?: string | null
          id?: string
          reference_id?: string | null
          user_id?: string | null
          xp_amount?: number | null
        }
        Relationships: []
      }
      gamification_profiles: {
        Row: {
          current_streak: number | null
          id: string
          last_activity_date: string | null
          level_current: number | null
          updated_at: string | null
          xp_total: number | null
        }
        Insert: {
          current_streak?: number | null
          id: string
          last_activity_date?: string | null
          level_current?: number | null
          updated_at?: string | null
          xp_total?: number | null
        }
        Update: {
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          level_current?: number | null
          updated_at?: string | null
          xp_total?: number | null
        }
        Relationships: []
      }
      grifo_chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          target_id: string
          target_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          target_id: string
          target_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          target_id?: string
          target_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      materiais_tarefa: {
        Row: {
          created_at: string
          descricao: string
          id: string
          responsavel: string
          tarefa_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          responsavel: string
          tarefa_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          responsavel?: string
          tarefa_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      metas_anuais: {
        Row: {
          ano: number
          created_at: string | null
          empresa_id: string
          id: string
          meta_faturamento: number | null
          meta_margem_liquida: number | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          empresa_id: string
          id?: string
          meta_faturamento?: number | null
          meta_margem_liquida?: number | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          empresa_id?: string
          id?: string
          meta_faturamento?: number | null
          meta_margem_liquida?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "metas_anuais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      obras: {
        Row: {
          considerar_na_meta: boolean | null
          created_at: string | null
          created_by: string | null
          data_inicio: string | null
          data_termino: string | null
          empresa_id: string | null
          faturamento_realizado: number | null
          id: string
          localizacao: string | null
          lucro_realizado: number | null
          nome_obra: string
          nps: number | null
          pmp_planta_url: string | null
          status: string | null
          usuario_id: string | null
        }
        Insert: {
          considerar_na_meta?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data_inicio?: string | null
          data_termino?: string | null
          empresa_id?: string | null
          faturamento_realizado?: number | null
          id?: string
          localizacao?: string | null
          lucro_realizado?: number | null
          nome_obra: string
          nps?: number | null
          pmp_planta_url?: string | null
          status?: string | null
          usuario_id?: string | null
        }
        Update: {
          considerar_na_meta?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data_inicio?: string | null
          data_termino?: string | null
          empresa_id?: string | null
          faturamento_realizado?: number | null
          id?: string
          localizacao?: string | null
          lucro_realizado?: number | null
          nome_obra?: string
          nps?: number | null
          pmp_planta_url?: string | null
          status?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_config: {
        Row: {
          coeficiente_1: number | null
          coeficiente_2: number | null
          coeficiente_selecionado: string | null
          created_at: string
          id: string
          obra_id: string
          updated_at: string
        }
        Insert: {
          coeficiente_1?: number | null
          coeficiente_2?: number | null
          coeficiente_selecionado?: string | null
          created_at?: string
          id?: string
          obra_id: string
          updated_at?: string
        }
        Update: {
          coeficiente_1?: number | null
          coeficiente_2?: number | null
          coeficiente_selecionado?: string | null
          created_at?: string
          id?: string
          obra_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbook_config_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: true
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_fornecimentos: {
        Row: {
          created_at: string | null
          etapa: string
          id: string
          obra_id: string
          observacao: string | null
          orcamento_meta_unitario: number
          proposta: string
          quantidade: number
          responsavel: string
          status: string
          unidade: string
          updated_at: string | null
          valor_contratado: number | null
        }
        Insert: {
          created_at?: string | null
          etapa: string
          id?: string
          obra_id: string
          observacao?: string | null
          orcamento_meta_unitario: number
          proposta: string
          quantidade: number
          responsavel: string
          status: string
          unidade: string
          updated_at?: string | null
          valor_contratado?: number | null
        }
        Update: {
          created_at?: string | null
          etapa?: string
          id?: string
          obra_id?: string
          observacao?: string | null
          orcamento_meta_unitario?: number
          proposta?: string
          quantidade?: number
          responsavel?: string
          status?: string
          unidade?: string
          updated_at?: string | null
          valor_contratado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_fornecimentos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_items: {
        Row: {
          contract_url: string | null
          created_at: string
          data_limite: string | null
          descricao: string
          destino: string | null
          destino_equipamentos: string | null
          destino_mao_de_obra: string | null
          destino_materiais: string | null
          destino_verbas: string | null
          id: string
          is_etapa: boolean | null
          nivel: number | null
          obra_id: string
          observacao: string | null
          ordem: number
          preco_total: number | null
          preco_unitario: number | null
          qtd: number | null
          responsavel: string | null
          status_contratacao: string | null
          unidade: string | null
          valor_contratado: number | null
          valor_equipamentos: number | null
          valor_mao_de_obra: number | null
          valor_materiais: number | null
          valor_verbas: number | null
        }
        Insert: {
          contract_url?: string | null
          created_at?: string
          data_limite?: string | null
          descricao: string
          destino?: string | null
          destino_equipamentos?: string | null
          destino_mao_de_obra?: string | null
          destino_materiais?: string | null
          destino_verbas?: string | null
          id?: string
          is_etapa?: boolean | null
          nivel?: number | null
          obra_id: string
          observacao?: string | null
          ordem: number
          preco_total?: number | null
          preco_unitario?: number | null
          qtd?: number | null
          responsavel?: string | null
          status_contratacao?: string | null
          unidade?: string | null
          valor_contratado?: number | null
          valor_equipamentos?: number | null
          valor_mao_de_obra?: number | null
          valor_materiais?: number | null
          valor_verbas?: number | null
        }
        Update: {
          contract_url?: string | null
          created_at?: string
          data_limite?: string | null
          descricao?: string
          destino?: string | null
          destino_equipamentos?: string | null
          destino_mao_de_obra?: string | null
          destino_materiais?: string | null
          destino_verbas?: string | null
          id?: string
          is_etapa?: boolean | null
          nivel?: number | null
          obra_id?: string
          observacao?: string | null
          ordem?: number
          preco_total?: number | null
          preco_unitario?: number | null
          qtd?: number | null
          responsavel?: string | null
          status_contratacao?: string | null
          unidade?: string | null
          valor_contratado?: number | null
          valor_equipamentos?: number | null
          valor_mao_de_obra?: number | null
          valor_materiais?: number | null
          valor_verbas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_items_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_obra: {
        Row: {
          created_at: string | null
          etapa: string
          id: string
          obra_id: string
          observacao: string | null
          orcamento_meta_unitario: number
          proposta: string
          quantidade: number
          responsavel: string
          status: string
          unidade: string
          updated_at: string | null
          valor_contratado: number | null
        }
        Insert: {
          created_at?: string | null
          etapa: string
          id?: string
          obra_id: string
          observacao?: string | null
          orcamento_meta_unitario: number
          proposta: string
          quantidade: number
          responsavel: string
          status: string
          unidade: string
          updated_at?: string | null
          valor_contratado?: number | null
        }
        Update: {
          created_at?: string | null
          etapa?: string
          id?: string
          obra_id?: string
          observacao?: string | null
          orcamento_meta_unitario?: number
          proposta?: string
          quantidade?: number
          responsavel?: string
          status?: string
          unidade?: string
          updated_at?: string | null
          valor_contratado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_obra_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      pmp_atividades: {
        Row: {
          concluido: boolean | null
          cor: string | null
          created_at: string | null
          data_inicio: string | null
          data_termino: string | null
          descricao: string | null
          id: string
          obra_id: string
          ordem: number | null
          responsavel: string | null
          semana_referencia: string
          setor: string | null
          titulo: string
        }
        Insert: {
          concluido?: boolean | null
          cor?: string | null
          created_at?: string | null
          data_inicio?: string | null
          data_termino?: string | null
          descricao?: string | null
          id?: string
          obra_id: string
          ordem?: number | null
          responsavel?: string | null
          semana_referencia: string
          setor?: string | null
          titulo: string
        }
        Update: {
          concluido?: boolean | null
          cor?: string | null
          created_at?: string | null
          data_inicio?: string | null
          data_termino?: string | null
          descricao?: string | null
          id?: string
          obra_id?: string
          ordem?: number | null
          responsavel?: string | null
          semana_referencia?: string
          setor?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "pmp_atividades_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      pmp_restricoes: {
        Row: {
          atividade_id: string
          created_at: string
          data_limite: string | null
          descricao: string
          id: string
          resolvido: boolean | null
        }
        Insert: {
          atividade_id: string
          created_at?: string
          data_limite?: string | null
          descricao: string
          id?: string
          resolvido?: boolean | null
        }
        Update: {
          atividade_id?: string
          created_at?: string
          data_limite?: string | null
          descricao?: string
          id?: string
          resolvido?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "pmp_restricoes_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "pmp_atividades"
            referencedColumns: ["id"]
          },
        ]
      }
      registros: {
        Row: {
          created_at: string
          empresa_id: string | null
          id: string
          obra_id: string | null
          tipo: string
          user_id: string | null
          valor: string
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          obra_id?: string | null
          tipo: string
          user_id?: string | null
          valor: string
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          obra_id?: string | null
          tipo?: string
          user_id?: string | null
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          created_at: string | null
          empresa_id: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "squads_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas: {
        Row: {
          causa_nao_execucao: string | null
          created_at: string | null
          descricao: string
          disciplina: string
          dom: string | null
          encarregado: string
          executante: string
          id: string
          item: string
          obra_id: string | null
          ordem: number | null
          percentual_executado: number | null
          qua: string | null
          qui: string | null
          responsavel: string
          sab: string | null
          seg: string | null
          semana: string
          setor: string
          sex: string | null
          ter: string | null
          updated_at: string | null
        }
        Insert: {
          causa_nao_execucao?: string | null
          created_at?: string | null
          descricao: string
          disciplina: string
          dom?: string | null
          encarregado: string
          executante: string
          id?: string
          item: string
          obra_id?: string | null
          ordem?: number | null
          percentual_executado?: number | null
          qua?: string | null
          qui?: string | null
          responsavel: string
          sab?: string | null
          seg?: string | null
          semana: string
          setor: string
          sex?: string | null
          ter?: string | null
          updated_at?: string | null
        }
        Update: {
          causa_nao_execucao?: string | null
          created_at?: string | null
          descricao?: string
          disciplina?: string
          dom?: string | null
          encarregado?: string
          executante?: string
          id?: string
          item?: string
          obra_id?: string | null
          ordem?: number | null
          percentual_executado?: number | null
          qua?: string | null
          qui?: string | null
          responsavel?: string
          sab?: string | null
          seg?: string | null
          semana?: string
          setor?: string
          sex?: string | null
          ter?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          email: string | null
          empresa_id: string | null
          id: string
          last_login: string | null
          nome: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          email?: string | null
          empresa_id?: string | null
          id: string
          last_login?: string | null
          nome?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          email?: string | null
          empresa_id?: string | null
          id?: string
          last_login?: string | null
          nome?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      marketplace_empresas: {
        Row: {
          ano_fundacao: string | null
          apresentacao_path: string | null
          cargo_contato: string | null
          cidade: string | null
          created_at: string | null
          desafios_outro: string | null
          email_contato: string | null
          estado: string | null
          ferramentas_gestao: string | null
          id: string | null
          ja_trabalhou_com_grifo: boolean | null
          logo_path: string | null
          nome_contato: string | null
          nome_empresa: string | null
          obras_andamento: string | null
          planejamento_curto_prazo: string | null
          principais_desafios: string[] | null
          selo_grifo: boolean | null
          site: string | null
          tamanho_empresa: string | null
          ticket_medio: string | null
          tipos_obras: string[] | null
          tipos_obras_outro: string | null
          user_id: string | null
          whatsapp_contato: string | null
        }
        Insert: {
          ano_fundacao?: string | null
          apresentacao_path?: string | null
          cargo_contato?: string | null
          cidade?: string | null
          created_at?: string | null
          desafios_outro?: string | null
          email_contato?: string | null
          estado?: string | null
          ferramentas_gestao?: string | null
          id?: string | null
          ja_trabalhou_com_grifo?: boolean | null
          logo_path?: string | null
          nome_contato?: string | null
          nome_empresa?: string | null
          obras_andamento?: string | null
          planejamento_curto_prazo?: string | null
          principais_desafios?: string[] | null
          selo_grifo?: boolean | null
          site?: string | null
          tamanho_empresa?: string | null
          ticket_medio?: string | null
          tipos_obras?: string[] | null
          tipos_obras_outro?: string | null
          user_id?: string | null
          whatsapp_contato?: string | null
        }
        Update: {
          ano_fundacao?: string | null
          apresentacao_path?: string | null
          cargo_contato?: string | null
          cidade?: string | null
          created_at?: string | null
          desafios_outro?: string | null
          email_contato?: string | null
          estado?: string | null
          ferramentas_gestao?: string | null
          id?: string | null
          ja_trabalhou_com_grifo?: boolean | null
          logo_path?: string | null
          nome_contato?: string | null
          nome_empresa?: string | null
          obras_andamento?: string | null
          planejamento_curto_prazo?: string | null
          principais_desafios?: string[] | null
          selo_grifo?: boolean | null
          site?: string | null
          tamanho_empresa?: string | null
          ticket_medio?: string | null
          tipos_obras?: string[] | null
          tipos_obras_outro?: string | null
          user_id?: string | null
          whatsapp_contato?: string | null
        }
        Relationships: []
      }
      marketplace_fornecedores: {
        Row: {
          capacidade_atendimento: string | null
          categorias_atendidas: string[] | null
          categorias_outro: string | null
          certificacoes_path: string | null
          cidade: string | null
          cidades_frequentes: string | null
          created_at: string | null
          diferenciais: string[] | null
          diferenciais_outro: string | null
          email: string | null
          estado: string | null
          fotos_trabalhos_path: string | null
          id: string | null
          ja_trabalhou_com_grifo: boolean | null
          logo_path: string | null
          nome_empresa: string | null
          nome_responsavel: string | null
          portfolio_path: string | null
          regioes_atendidas: string[] | null
          selo_grifo: boolean | null
          site: string | null
          telefone: string | null
          tempo_atuacao: string | null
          ticket_medio: string | null
          tipo_atuacao_outro: string | null
          tipos_atuacao: string[] | null
          user_id: string | null
        }
        Insert: {
          capacidade_atendimento?: string | null
          categorias_atendidas?: string[] | null
          categorias_outro?: string | null
          certificacoes_path?: string | null
          cidade?: string | null
          cidades_frequentes?: string | null
          created_at?: string | null
          diferenciais?: string[] | null
          diferenciais_outro?: string | null
          email?: string | null
          estado?: string | null
          fotos_trabalhos_path?: string | null
          id?: string | null
          ja_trabalhou_com_grifo?: boolean | null
          logo_path?: string | null
          nome_empresa?: string | null
          nome_responsavel?: string | null
          portfolio_path?: string | null
          regioes_atendidas?: string[] | null
          selo_grifo?: boolean | null
          site?: string | null
          telefone?: string | null
          tempo_atuacao?: string | null
          ticket_medio?: string | null
          tipo_atuacao_outro?: string | null
          tipos_atuacao?: string[] | null
          user_id?: string | null
        }
        Update: {
          capacidade_atendimento?: string | null
          categorias_atendidas?: string[] | null
          categorias_outro?: string | null
          certificacoes_path?: string | null
          cidade?: string | null
          cidades_frequentes?: string | null
          created_at?: string | null
          diferenciais?: string[] | null
          diferenciais_outro?: string | null
          email?: string | null
          estado?: string | null
          fotos_trabalhos_path?: string | null
          id?: string | null
          ja_trabalhou_com_grifo?: boolean | null
          logo_path?: string | null
          nome_empresa?: string | null
          nome_responsavel?: string | null
          portfolio_path?: string | null
          regioes_atendidas?: string[] | null
          selo_grifo?: boolean | null
          site?: string | null
          telefone?: string | null
          tempo_atuacao?: string | null
          ticket_medio?: string | null
          tipo_atuacao_outro?: string | null
          tipos_atuacao?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      marketplace_profissionais: {
        Row: {
          certificacoes_path: string | null
          cidade: string | null
          cidades_frequentes: string | null
          created_at: string | null
          curriculo_path: string | null
          diferenciais: string[] | null
          diferenciais_outro: string | null
          disponibilidade_atual: string | null
          email: string | null
          equipamentos_proprios: string | null
          especialidades: string[] | null
          especialidades_outro: string | null
          estado: string | null
          fotos_trabalhos_path: string | null
          funcao_principal: string | null
          funcao_principal_outro: string | null
          id: string | null
          ja_trabalhou_com_grifo: boolean | null
          logo_path: string | null
          modalidade_trabalho: string | null
          nome_completo: string | null
          obras_relevantes: string | null
          pretensao_valor: string | null
          regioes_atendidas: string[] | null
          selo_grifo: boolean | null
          telefone: string | null
          tempo_experiencia: string | null
          user_id: string | null
        }
        Insert: {
          certificacoes_path?: string | null
          cidade?: string | null
          cidades_frequentes?: string | null
          created_at?: string | null
          curriculo_path?: string | null
          diferenciais?: string[] | null
          diferenciais_outro?: string | null
          disponibilidade_atual?: string | null
          email?: string | null
          equipamentos_proprios?: string | null
          especialidades?: string[] | null
          especialidades_outro?: string | null
          estado?: string | null
          fotos_trabalhos_path?: string | null
          funcao_principal?: string | null
          funcao_principal_outro?: string | null
          id?: string | null
          ja_trabalhou_com_grifo?: boolean | null
          logo_path?: string | null
          modalidade_trabalho?: string | null
          nome_completo?: string | null
          obras_relevantes?: string | null
          pretensao_valor?: string | null
          regioes_atendidas?: string[] | null
          selo_grifo?: boolean | null
          telefone?: string | null
          tempo_experiencia?: string | null
          user_id?: string | null
        }
        Update: {
          certificacoes_path?: string | null
          cidade?: string | null
          cidades_frequentes?: string | null
          created_at?: string | null
          curriculo_path?: string | null
          diferenciais?: string[] | null
          diferenciais_outro?: string | null
          disponibilidade_atual?: string | null
          email?: string | null
          equipamentos_proprios?: string | null
          especialidades?: string[] | null
          especialidades_outro?: string | null
          estado?: string | null
          fotos_trabalhos_path?: string | null
          funcao_principal?: string | null
          funcao_principal_outro?: string | null
          id?: string | null
          ja_trabalhou_com_grifo?: boolean | null
          logo_path?: string | null
          modalidade_trabalho?: string | null
          nome_completo?: string | null
          obras_relevantes?: string | null
          pretensao_valor?: string | null
          regioes_atendidas?: string[] | null
          selo_grifo?: boolean | null
          telefone?: string | null
          tempo_experiencia?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ranking_grifoway: {
        Row: {
          empresa_id: string | null
          nome: string | null
          pontuacao_geral: number | null
          posicao_empresa: number | null
          posicao_geral: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      ranking_publico: {
        Row: {
          current_streak: number | null
          id: string | null
          level_current: number | null
          nome: string | null
          posicao: number | null
          xp_total: number | null
        }
        Relationships: []
      }
      ranking_users_view: {
        Row: {
          empresa_id: string | null
          id: string | null
          nome: string | null
        }
        Insert: {
          empresa_id?: string | null
          id?: string | null
          nome?: string | null
        }
        Update: {
          empresa_id?: string | null
          id?: string | null
          nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      resumo_execucao_semanal: {
        Row: {
          obra_id: string | null
          percentual_concluido: number | null
          semana: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_email_exists_global: {
        Args: { email_to_check: string }
        Returns: string
      }
      current_empresa_id: { Args: never; Returns: string }
      get_empresas_stats: {
        Args: never
        Returns: {
          created_at: string
          id: string
          nome: string
          total_obras: number
          total_usuarios: number
          ultimo_login: string
        }[]
      }
      get_grifoway_ranking: {
        Args: { p_empresa_id?: string; p_limit?: number }
        Returns: {
          nome: string
          pontuacao_geral: number
          posicao: number
          user_id: string
        }[]
      }
      is_company_admin: { Args: never; Returns: boolean }
      is_master_admin: { Args: never; Returns: boolean }
      link_user_to_form: {
        Args: { p_entity_id: string; p_entity_type: string; p_user_id: string }
        Returns: boolean
      }
      match_documents: {
        Args: {
          filter?: Json
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
    }
    Enums: {
      user_role: "admin" | "member" | "master_admin" | "parceiro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "member", "master_admin", "parceiro"],
    },
  },
} as const
