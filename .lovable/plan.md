

# Melhorias Mobile - GrifoBoard

## Resumo
Revisao completa da experiencia mobile para tornar o app mais pratico e rapido. Inclui atualizacao das abas do footer, correcao de problemas de UI/UX em cada pagina principal, e otimizacoes de layout.

---

## 1. Atualizar Footer Mobile (Abas de Navegacao)

**Problema atual:** O footer mostra PMP, PCP, Diario, Grifo AI, Metas. O usuario quer: Obras, PMP, PCP, Diario, GrifoAI e Playbook (6 itens).

**Solucao:** Atualizar `MobileBottomNav.tsx` com as 6 abas solicitadas:
- Obras (`/obras`) - icone Building2
- PMP (`/pmp`) - icone KanbanSquare
- PCP (`/tarefas`) - icone LayoutDashboard
- Diario (`/diarioobra`) - icone FileText
- GrifoAI (`/grifo-ai`) - icone Bot
- Playbook (`/playbook`) - icone BookOpen

Reduzir o tamanho dos icones e fontes para acomodar 6 itens confortavelmente.

---

## 2. Pagina Obras - Correcoes Mobile

**Problemas identificados (conforme screenshot):**
- Titulo "REFORMA REMBRANDT" quebra de forma estranha, com botoes Editar/Excluir espremidos
- Cards muito grandes, ocupam tela inteira
- Padding excessivo

**Solucao no `ObraCard.tsx`:**
- No mobile, mover botoes Editar/Excluir para baixo do titulo (empilhar verticalmente)
- Reduzir tamanho do titulo no mobile
- Tornar o card mais compacto

**Solucao no `Obras.tsx`:**
- Reduzir padding e espacamento no mobile
- Titulo "Minhas Obras" menor no mobile
- Esconder descricao longa no mobile

---

## 3. GrifoAI - Correcoes Mobile

**Problemas:**
- Header do chat ocupa espaco desnecessario
- Altura `calc(100vh-2rem)` nao considera o header mobile (56px) nem o footer (64px)
- Input pode ficar atras do footer

**Solucao no `GrifoAI.tsx`:**
- No mobile, usar altura que desconta header (56px) + footer (64px) + safe-area
- Compactar header no mobile (esconder texto "Limpar Conversa", mostrar so icone)
- Garantir que o input nao fique atras do bottom nav

---

## 4. PMP (Kanban) - Correcoes Mobile

**Problemas:**
- O kanban horizontal pode ser dificil de navegar no mobile
- Header pode ter filtros que ocupam muito espaco

**Solucao:**
- Garantir que colunas tenham scroll horizontal fluido
- Compactar filtros no mobile

---

## 5. PCP (Tarefas/Index) - Correcoes Mobile

**Problemas:**
- `MainPageContent.tsx` tem padding duplo (AppLayout ja adiciona p-3, e MainPageContent adiciona mais px-3)
- O tab header nao e sticky no mobile (ja desabilitado intencionalmente), ok manter assim

**Solucao:**
- Remover padding duplicado no mobile
- Garantir que `pb-24` seja suficiente para nao ficar atras do footer

---

## 6. Diario de Obra - Verificar Layout

- Verificar que formularios nao ficam atras do footer
- Garantir que o calendario funciona bem no mobile

---

## 7. Playbook - Nova Aba no Footer

- Verificar que a pagina Playbook renderiza corretamente no mobile
- Tabela virtualizada precisa funcionar bem em telas pequenas

---

## Detalhes Tecnicos

**Arquivos a modificar:**

| Arquivo | Mudanca |
|---|---|
| `src/components/mobile/MobileBottomNav.tsx` | 6 abas: Obras, PMP, PCP, Diario, GrifoAI, Playbook |
| `src/components/obra/ObraCard.tsx` | Layout responsivo - botoes embaixo no mobile |
| `src/pages/Obras.tsx` | Reducao de padding/espacamento mobile |
| `src/pages/GrifoAI.tsx` | Altura correta descontando header+footer, header compacto |
| `src/components/MainPageContent.tsx` | Remover padding duplicado mobile |

**Arquivos a verificar (ajustes menores se necessario):**
- `src/pages/DiarioObra.tsx`
- `src/pages/Playbook.tsx`
- `src/components/pmp/PmpKanbanBoard.tsx`
- `src/App.tsx` (AppLayout - verificar padding)

