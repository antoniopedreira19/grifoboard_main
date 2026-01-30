
# Plano: Exportar PDF do Diário de Obra

## Resumo

Adicionar funcionalidade de exportação em PDF para o Diário de Obra, permitindo exportar por dia individual ou por semana, incluindo todos os dados (clima, mão de obra, equipamentos, atividades, ocorrências, observações) e as fotos associadas.

## O que será criado

### 1. Nova Edge Function: `export-diario-pdf`

Uma função serverless que:
- Recebe os parâmetros de exportação (obra, data ou intervalo de datas)
- Busca os diários no período especificado
- Busca as fotos associadas a cada dia e gera URLs assinadas
- Gera um HTML formatado para impressão/PDF com todas as informações

### 2. Componente de Exportação: `DiarioExportDialog`

Um modal de exportação com opções:
- **Por Dia**: Exporta apenas o diário do dia selecionado
- **Por Semana**: Exporta todos os diários da semana atual (segunda a domingo), separados por dia

### 3. Integração na Página

Adicionar botão de "Exportar PDF" no header da página de Diário de Obra.

---

## Sobre as Imagens

**Sim, é possível incluir as imagens!** As fotos do diário estão armazenadas no Supabase Storage (bucket `diario-obra`). A edge function irá:

1. Buscar as fotos de cada dia via tabela `diario_fotos`
2. Gerar URLs assinadas para cada foto
3. Incluir as imagens diretamente no HTML usando as URLs assinadas
4. As imagens aparecerão em uma galeria organizada por dia

**Observação**: Para imagens muito grandes, o PDF pode ficar pesado. O sistema redimensionará as imagens via CSS para otimizar o tamanho do documento.

---

## Detalhes Técnicos

### Edge Function (`supabase/functions/export-diario-pdf/index.ts`)

```text
Estrutura do payload:
{
  obraId: string,
  obraNome: string,
  exportType: "day" | "week",
  date: string (ISO - data selecionada),
  includePhotos: boolean
}
```

**Fluxo da função:**
1. Validar autenticação
2. Determinar período (dia único ou semana)
3. Buscar diários no período (`diarios_obra`)
4. Para cada diário, buscar fotos (`diario_fotos`)
5. Gerar URLs assinadas para cada foto
6. Montar HTML com design Grifo (igual aos outros PDFs)
7. Retornar HTML para impressão

### Layout do PDF

```text
+----------------------------------+
|  [Logo Grifo]    Diário de Obra  |
|  Obra: Nome da Obra              |
|  Período: XX/XX/XXXX             |
+----------------------------------+

📅 Segunda-feira, 27 de Janeiro de 2025
+----------------------------------+
| Clima                            |
| ☀️ Manhã: Ensolarado             |
| 🌤️ Tarde: Nublado                |
| 🌙 Noite: Chuvoso                |
+----------------------------------+
| Mão de Obra: Descrição...        |
| Equipamentos: Descrição...       |
+----------------------------------+
| Atividades Realizadas:           |
| - Descrição detalhada...         |
+----------------------------------+
| Ocorrências:                     |
| - Descrição...                   |
+----------------------------------+
| Observações:                     |
| - Descrição...                   |
+----------------------------------+
| Fotos do Dia:                    |
| [img] [img] [img]                |
| Legenda da foto...               |
+----------------------------------+

(Repete para cada dia da semana)
```

### Componente React (`src/components/diario/DiarioExportDialog.tsx`)

- Modal com opções de exportação
- RadioGroup: "Dia Atual" ou "Semana Atual"
- Checkbox: "Incluir fotos" (marcado por padrão)
- Botão de exportar que chama a edge function

### Modificações na Página

**Arquivo**: `src/pages/DiarioObra.tsx`
- Importar e renderizar `DiarioExportDialog` no header
- Passar props: `obraId`, `obraNome`, `date` (data atual selecionada)

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/export-diario-pdf/index.ts` | Criar |
| `supabase/config.toml` | Adicionar nova função |
| `src/components/diario/DiarioExportDialog.tsx` | Criar |
| `src/pages/DiarioObra.tsx` | Modificar (adicionar botão) |

---

## Fluxo do Usuário

1. Usuário acessa Diário de Obra
2. Seleciona um dia no calendário
3. Clica no botão "Exportar PDF"
4. Modal abre com opções:
   - Exportar apenas o dia selecionado
   - Exportar semana inteira (segunda a domingo)
   - Incluir fotos (checkbox)
5. Clica em "Exportar"
6. Sistema busca dados e gera HTML
7. Abre janela de impressão do navegador
8. Usuário pode salvar como PDF ou imprimir
