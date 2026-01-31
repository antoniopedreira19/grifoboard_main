

# Plano de Otimizacao - GrifoAI Performance

## Resumo

O objetivo e melhorar a **percepcao de velocidade** da GrifoAI atraves de otimizacoes no frontend e na Edge Function. A maior parte do tempo de resposta (~95%) e do n8n/IA, mas podemos reduzir significativamente o tempo percebido pelo usuario.

---

## O Que Sera Implementado

### 1. UI Otimista e Salvamento em Background

**Antes:** O usuario envia a mensagem -> Salva no banco -> Espera a IA -> Salva resposta -> Atualiza UI
**Depois:** O usuario envia a mensagem -> UI atualiza instantaneamente -> Operacoes em paralelo

**Beneficio:** A mensagem do usuario aparece imediatamente, sem esperar o banco de dados.

### 2. Indicador de Digitacao Animado

Substituir o simples "Consultando..." por uma animacao de "typing indicator" (tres pontinhos pulsando) que da feedback visual constante ao usuario.

### 3. Mensagens de Status Dinamicas

Durante a espera, exibir mensagens rotativas como:
- "Analisando sua pergunta..."
- "Consultando base de conhecimento..."
- "Preparando resposta..."

Isso reduz a percepcao de tempo de espera.

### 4. Timeout com Feedback

Adicionar um timeout de 60 segundos com mensagem amigavel caso o n8n demore demais, evitando que o usuario fique esperando indefinidamente.

### 5. Memoizacao de Componentes

Otimizar re-renders desnecessarios usando `React.memo` nos componentes de mensagem.

---

## Detalhes Tecnicos

### Arquivo: `src/pages/GrifoAI.tsx`

```text
Mudancas:
1. Refatorar handleSend para UI otimista:
   - Atualizar estado local ANTES de chamar API
   - Salvar mensagem do usuario em background (sem await)
   - Chamar edge function em paralelo

2. Novo componente TypingIndicator:
   - Animacao CSS de 3 dots pulsando
   - Mensagens de status rotativas

3. Adicionar AbortController para timeout:
   - Cancelar requisicao apos 60s
   - Exibir mensagem de erro amigavel

4. Memoizar MessageBubble component:
   - Evitar re-render de mensagens antigas
```

### Arquivo: `src/components/grifo-ai/TypingIndicator.tsx` (novo)

```text
Componente dedicado para:
- Animacao de typing dots
- Rotacao de mensagens de status
- Estilo consistente com o chat
```

### Arquivo: `src/index.css`

```text
Adicionar:
- Keyframes para animacao de typing dots
- Classes utilitarias para o indicador
```

### Arquivo: `supabase/functions/grifo-ai/index.ts`

```text
Melhorias:
- Adicionar timeout interno de 55s
- Logging mais detalhado para debug
- Melhor tratamento de erros
```

---

## Fluxo Otimizado

```text
Usuario digita mensagem
        |
        v
+------------------+
| UI Atualiza      | <-- Instantaneo (0ms)
| (msg do usuario) |
+------------------+
        |
   [Em paralelo]
        |
   +----+----+
   |         |
   v         v
Salva DB   Chama n8n
(background) (aguarda)
   |         |
   +----+----+
        |
        v
+------------------+
| Exibe resposta   |
| + Salva DB       |
+------------------+
```

---

## Resultado Esperado

| Metrica | Antes | Depois |
|---------|-------|--------|
| Tempo para msg aparecer | ~500ms | ~50ms |
| Feedback visual | Estatico | Animado |
| Percepcao de espera | Longa | Reduzida |
| Tratamento de timeout | Nenhum | 60s + mensagem |

---

## Arquivos a Modificar

1. `src/pages/GrifoAI.tsx` - Logica principal e UI otimista
2. `src/components/grifo-ai/TypingIndicator.tsx` - Novo componente
3. `src/index.css` - Animacoes CSS
4. `supabase/functions/grifo-ai/index.ts` - Timeout e logging

