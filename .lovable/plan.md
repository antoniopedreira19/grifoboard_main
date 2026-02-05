
# Plano de Correcao - Filtros Persistentes no PCP

## Problema Identificado

Quando o usuario atualiza o status de uma tarefa, os filtros aplicados (setor, disciplina, executante, etc.) sao resetados. A causa raiz e uma **arquitetura fragmentada de gerenciamento de estado**:

1. **`useTaskActions.ts`** recalcula `filteredTasks` usando apenas `filterTasksByWeek()`, ignorando os filtros visuais
2. **`TaskFilters.tsx`** tambem atualiza `filteredTasks` via callback `onFiltersChange`
3. **`TaskList.tsx`** tem um `useEffect` que sobrescreve `filteredTasks` quando `tasks` muda

Resultado: ao atualizar uma tarefa, o estado sobrescreve os filtros aplicados pelo usuario.

## Solucao Proposta

Centralizar a logica de filtragem no componente `TaskFilters` e garantir que atualizacoes de tarefas preservem os filtros ativos.

### Estrategia

1. **Mover estado dos filtros para o `TaskList`** - os filtros deixam de ser locais ao `TaskFilters` e passam a ser controlados pelo componente pai
2. **`useTaskActions` nao deve chamar `setFilteredTasks`** - apenas atualiza `tasks`, deixando a filtragem para o fluxo normal dos componentes
3. **`TaskFilters` recalcula sempre que `tasks` muda** - usando os filtros atuais

---

## Arquivos a Modificar

### 1. `src/hooks/task/useTaskActions.ts`

**Problema:** Linhas 85-91 sobrescrevem os filtros visuais.

**Solucao:** Remover as chamadas a `filterTasksByWeek` e `setFilteredTasks` das funcoes de update/delete/create. Apenas atualizar o estado `tasks` e deixar o fluxo reativo do React fazer a filtragem.

```text
Antes (linha 85-91):
const updatedTasks = tasks.map((task) => ...);
setTasks(updatedTasks);
const updatedFilteredTasks = filterTasksByWeek(updatedTasks, weekStartDate);
setFilteredTasks(updatedFilteredTasks);
calculatePCPData(updatedFilteredTasks);

Depois:
const updatedTasks = tasks.map((task) => ...);
setTasks(updatedTasks);
// Filtros serao recalculados automaticamente pelo TaskFilters
```

### 2. `src/components/TaskList.tsx`

**Problema:** O `useEffect` na linha 58-60 reseta para `tasksAfterCauseFilter` sempre que `tasks` muda, ignorando outros filtros.

**Solucao:** Remover este `useEffect`. O `TaskFilters` ja chama `onFiltersChange` quando `processedTasks` muda (que depende de `tasks`).

### 3. `src/components/task/TaskFilters.tsx`

**Problema:** O `useEffect` na linha 116-126 reseta TODOS os filtros quando `selectedCause` muda.

**Solucao:** Remover este reset automatico ou torna-lo opcional. Os filtros so devem ser resetados quando o usuario explicitamente clicar em "Limpar Filtros".

---

## Fluxo Corrigido

```text
Usuario muda status da tarefa
        |
        v
  TaskCard.onUpdate()
        |
        v
  useTaskActions.handleTaskUpdate()
        |
        v
  setTasks(updatedTasks)  <-- Apenas atualiza o estado global
        |
        v
  [React detecta mudanca em "tasks"]
        |
        v
  TaskFilters recalcula processedTasks
  (usando filtros ATUAIS do usuario)
        |
        v
  onFiltersChange(processedTasks)
        |
        v
  UI atualiza mantendo filtros
```

---

## Mudancas Detalhadas

### Arquivo: `src/hooks/task/useTaskActions.ts`

1. Remover parametros `filterTasksByWeek` e `setFilteredTasks` da interface `TaskActionsProps`
2. Nas funcoes `handleTaskUpdate`, `handleTaskDelete`, `handleTaskCreate`, `handleTaskDuplicate`, `handleCopyToNextWeek`:
   - Remover chamadas a `filterTasksByWeek()`
   - Remover chamadas a `setFilteredTasks()`
   - Manter apenas `setTasks()` e `calculatePCPData()` (com tasks completas para PCP global)

### Arquivo: `src/hooks/useTaskManager.tsx`

1. Remover passagem de `filterTasksByWeek` e `setFilteredTasks` para `useTaskActions`
2. O `useEffect` que filtra por semana (linhas 80-104) continua funcionando para sincronizar `filteredTasks` quando a semana muda

### Arquivo: `src/components/TaskList.tsx`

1. Remover o `useEffect` que chama `setFilteredTasks(tasksAfterCauseFilter)` (linhas 58-60)
2. Inicializar `filteredTasks` com um array vazio e deixar o `TaskFilters` popular via callback

### Arquivo: `src/components/task/TaskFilters.tsx`

1. Remover o `useEffect` que reseta filtros quando `selectedCause` muda (linhas 116-126)
2. Alternativa: manter o reset apenas do termo de busca, preservando os outros filtros

---

## Resultado Esperado

| Cenario | Antes | Depois |
|---------|-------|--------|
| Mudar status com filtro ativo | Filtro resetado | Filtro mantido |
| Navegar entre semanas | OK | OK |
| Criar nova tarefa | Filtros resetados | Filtros mantidos |
| Deletar tarefa | Filtros resetados | Filtros mantidos |

---

## Testes Recomendados

1. Aplicar filtro por Setor -> Mudar status de tarefa -> Verificar se filtro permanece
2. Aplicar multiplos filtros -> Editar tarefa -> Verificar todos os filtros
3. Navegar para outra semana -> Voltar -> Verificar se filtros persistem (opcional)
4. Clicar em "Limpar Filtros" -> Verificar se todos limpam
