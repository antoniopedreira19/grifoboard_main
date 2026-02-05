
# Plano: Aderência ao Sistema na Gestão de Metas

## Objetivo
Adicionar uma nova seção na página de Gestão de Metas que mostra métricas de aderência ao sistema, incluindo ranking de uso, breakdown por feature (Diário, PMP, PCP, Playbook) e visualização detalhada por usuário.

## Arquitetura de Dados

Os dados necessários já existem no banco de dados:

| Tabela | Uso |
|--------|-----|
| `gamification_profiles` | XP total, nível e última atividade de cada usuário |
| `gamification_logs` | Logs detalhados por action_type (TAREFA_CONCLUIDA, DIARIO_CRIADO, PMP_ATIVIDADE_CONCLUIDA, etc.) |
| `usuarios` | Nome e empresa_id dos usuários |

Os `action_types` mapeiam para features:
- **PCP**: `TAREFA_CONCLUIDA` (30 XP)
- **Diário de Obra**: `DIARIO_CRIADO` (25 XP)
- **PMP Atividades**: `PMP_ATIVIDADE_CONCLUIDA` (50 XP)
- **PMP Restrições**: `PMP_RESTRICAO_CONCLUIDA` (20 XP)
- **Playbook**: `CONTRATACAO_FAST` (50 XP), `ECONOMIA_PLAYBOOK` (100 XP)

## Design da Interface

Uma nova aba "Aderência" será adicionada ao switcher existente (Squads | Obras | **Aderência**):

```text
+--------------------------------------------------+
| RANKING DE ADERÊNCIA                             |
+--------------------------------------------------+
|  #  | Usuário      | XP Total | Nível | Features |
|-----|--------------|----------|-------|----------|
|  1  | Matheus      | 6230 XP  |   7   | [badges] |
|  2  | V&V          | 5850 XP  |   6   | [badges] |
|  3  | Heitor       | 3790 XP  |   4   | [badges] |
+--------------------------------------------------+
```

Cada linha mostrará badges coloridos indicando quais features o usuário utiliza:
- Verde: PCP (tarefas)
- Azul: Diário de Obra
- Roxo: PMP
- Dourado: Playbook

## Implementação Técnica

### 1. Nova Query para dados de aderência
Buscar do banco:
- Perfis de gamificação com join em usuários (filtrado por empresa)
- Logs agrupados por user_id e action_type (contagens)

### 2. Novo componente: `AdherenceRanking`
- Lista rankeada de usuários por XP
- Indicadores visuais de quais features cada um usa
- Progresso geral da equipe

### 3. Cards de Resumo (topo da seção)
- Total de usuários ativos
- Feature mais utilizada
- Média de XP da equipe
- Usuário mais engajado

### 4. Integração na página
- Adicionar botão "Aderência" no switcher de viewMode
- Renderizar condicionalmente quando `viewMode === "aderencia"`

## Estrutura de Componentes

```text
GestaoMetas.tsx
├── Query: useQuery(['aderencia', empresa_id])
│   ├── gamification_profiles (join usuarios)
│   └── gamification_logs (agregado por user/action)
│
├── ViewMode Switcher: [Squads] [Obras] [Aderência]
│
└── {viewMode === "aderencia" && (
    ├── Cards de Resumo (4 KPIs)
    └── Tabela de Ranking com badges de features
)}
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/GestaoMetas.tsx` | Adicionar nova query, estado de aderência, nova seção de visualização |

## Detalhes de UI

- Manter estética escura (slate-900/950) consistente com a página
- Usar cores do tema dourado (#C7A347) para destaques
- Badges coloridos para cada feature
- Ícones: `Activity` (aderência), `BookOpen` (diário), `ListTodo` (PCP), `Target` (PMP), `Handshake` (Playbook)
- Progress bars mostrando engajamento por feature
- Medalhas para top 3 (ouro, prata, bronze)
