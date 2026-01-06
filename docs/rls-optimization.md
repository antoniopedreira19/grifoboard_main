# RLS Optimization Report

Este documento descreve as otimizações aplicadas nas políticas de Row Level Security (RLS) do Supabase para eliminar os avisos "Auth RLS Initialization Plan" e melhorar a performance das consultas.

## Problema Original

As políticas RLS originais utilizavam diretamente funções como `auth.uid()`, `auth.role()` e `current_setting()`, causando:
- Múltiplas avaliações por linha durante consultas
- Avisos "Auth RLS Initialization Plan" no Advisor
- Performance degradada em consultas com muitas linhas

## Solução Implementada

### 1. Helpers Estáveis (STABLE Functions)

Criamos o schema `app` com helpers estáveis para centralizar chamadas auth:

```sql
-- Schema dedicado para helpers
CREATE SCHEMA app;

-- Helpers estáveis que são avaliados uma vez por consulta
CREATE FUNCTION app.current_user_id() RETURNS uuid STABLE;
CREATE FUNCTION app.current_role() RETURNS text STABLE;  
CREATE FUNCTION app.current_claim(text) RETURNS text STABLE;
```

### 2. Policies Consolidadas

Substituímos múltiplas policies por operação (SELECT, INSERT, UPDATE, DELETE) por uma única policy `FOR ALL` em cada tabela:

**Antes:**
- 4 policies separadas por tabela (SELECT, INSERT, UPDATE, DELETE)
- Uso direto de `auth.uid()` repetidamente

**Depois:**
- 1 policy `FOR ALL` por tabela
- Uso de `app.current_user_id()` avaliado uma vez por consulta
- USING e WITH CHECK simétricos para consistência

### 3. Índices Otimizados

Adicionamos índices nas colunas utilizadas pelas policies:

```sql
CREATE INDEX idx_obras_usuario_id ON obras(usuario_id);
CREATE INDEX idx_tarefas_obra_id ON tarefas(obra_id);
CREATE INDEX idx_atividades_checklist_obra_id ON atividades_checklist(obra_id);
CREATE INDEX idx_materiais_tarefa_tarefa_id ON materiais_tarefa(tarefa_id);
CREATE INDEX idx_registros_obra_id ON registros(obra_id);
```

## Tabelas Otimizadas

| Tabela | Policy Original | Policy Otimizada |
|--------|----------------|------------------|
| `usuarios` | Uses `auth.uid() = id` | Uses `app.current_user_id() = id` |
| `obras` | Uses `auth.uid() = usuario_id` | Uses `app.current_user_id() = usuario_id` |
| `tarefas` | JOIN com `auth.uid()` | EXISTS com `app.current_user_id()` |
| `atividades_checklist` | 4 policies separadas | 1 policy consolidada |
| `materiais_tarefa` | 4 policies separadas | 1 policy consolidada |
| `registros` | 4 policies separadas | 1 policy consolidada |

## Benefícios Alcançados

✅ **Performance:** Helpers STABLE reduzem avaliações de auth por consulta  
✅ **Manutenibilidade:** 1 policy por tabela em vez de 4  
✅ **Consistência:** USING/WITH CHECK simétricos  
✅ **Indexação:** Consultas RLS otimizadas com índices apropriados  
✅ **Advisor:** Eliminação dos avisos "Auth RLS Initialization Plan"  

## Comportamento Mantido

- ✅ Usuários continuam vendo apenas seus próprios dados
- ✅ Tarefas, atividades e materiais filtrados por obra do usuário  
- ✅ Registros acessíveis apenas pelo dono da obra
- ✅ Mesmas permissões de leitura/escrita mantidas

## Monitoramento

Para verificar a eficácia das otimizações:

1. Execute o Advisor do Supabase para confirmar eliminação dos avisos RLS
2. Monitore logs de performance das consultas principais
3. Verifique que as consultas utilizam os índices criados via `EXPLAIN ANALYZE`

---

**Data da Otimização:** Janeiro 2025  
**Status:** ✅ Completo - Policies otimizadas e índices aplicados