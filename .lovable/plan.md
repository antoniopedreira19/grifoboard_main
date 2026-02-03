
# Plano de Correção - Status "Não Iniciada" nas Obras

## Problema Identificado

A tabela `obras` possui uma **CHECK constraint** que restringe os valores do campo `status`:

```sql
CHECK ((status = ANY (ARRAY['em_andamento'::text, 'concluida'::text, 'paralisada'::text])))
```

O frontend está usando o valor `nao_iniciada`, que **não está incluído** nesta constraint, causando erro no banco de dados.

## Solução

Atualizar a constraint no banco de dados para incluir o valor `nao_iniciada`.

## Alteração no Banco de Dados

Executar uma migração SQL para:
1. Remover a constraint antiga
2. Adicionar nova constraint com o valor `nao_iniciada` incluído

```sql
-- Remover constraint antiga
ALTER TABLE obras DROP CONSTRAINT obras_status_check;

-- Adicionar nova constraint com nao_iniciada
ALTER TABLE obras ADD CONSTRAINT obras_status_check 
  CHECK (status = ANY (ARRAY['em_andamento'::text, 'concluida'::text, 'paralisada'::text, 'nao_iniciada'::text]));
```

## Arquivos Impactados

Nenhuma alteração de código é necessária - o frontend já usa `nao_iniciada` corretamente nos componentes:
- `src/components/obra/ObraForm.tsx` (linha 207)
- `src/components/obra/ObraEditForm.tsx` (linha 202)

## Resultado Esperado

Após a migração:
- Criar obra com status "Não iniciada" funcionará
- Atualizar obra para status "Não iniciada" funcionará
- Os valores válidos serão: `em_andamento`, `concluida`, `paralisada`, `nao_iniciada`
