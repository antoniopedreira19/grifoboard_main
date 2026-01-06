import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TaskData {
  setor: string;
  descricao: string;
  disciplina: string;
  executante: string;
  responsavel: string;
  encarregado: string;
  seg: string | null;
  ter: string | null;
  qua: string | null;
  qui: string | null;
  sex: string | null;
  sab: string | null;
  dom: string | null;
}
interface GroupedTasks {
  [key: string]: TaskData[];
}

const DOW_PT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function formatDate(d: Date) {
  return d.toLocaleDateString("pt-BR");
}
function formatDateRange(a: Date, b: Date) {
  return `${formatDate(a)} a ${formatDate(b)}`;
}

function getCurrentDateTimeBR(): { date: string; time: string } {
  const now = new Date();
  const brazilTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  return {
    date: brazilTime.toLocaleDateString("pt-BR"),
    time: brazilTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

// Helper para status colorido no PDF (Símbolos mais visíveis)
function getStatusHtml(status: string | null): string {
  if (!status || !status.trim()) return "";
  const s = status.toLowerCase().trim();

  if (s === "executada") return '<span style="color:#166534; font-size: 14px; font-weight:bold;">✓</span>'; // Verde Escuro
  if (s === "não feita" || s === "nao feita")
    return '<span style="color:#dc2626; font-size: 14px; font-weight:bold;">×</span>'; // Vermelho
  return '<span style="color:#94a3b8; font-size: 16px;">•</span>'; // Cinza (Planejado)
}

function sortSetores(setores: string[]): string[] {
  return setores.sort((A, B) => {
    const a = (A || "").toUpperCase();
    const b = (B || "").toUpperCase();
    if (a === "GERAL") return -1;
    if (b === "GERAL") return 1;
    const am = a.match(/^SETOR\s+(\d+)$/);
    const bm = b.match(/^SETOR\s+(\d+)$/);
    if (am && bm) return +am[1] - +bm[1];
    if (am && !bm) return -1;
    if (!am && bm) return 1;
    return a.localeCompare(b);
  });
}

// Gera o HTML Bonito com Design Grifo
async function generateHtmlContent(
  tasks: TaskData[],
  obraNome: string,
  weekStart: Date,
  weekEnd: Date,
  groupBy: "setor" | "executante" = "setor",
  executanteFilter?: string,
): Promise<string> {
  const { date: currentDate, time: currentTime } = getCurrentDateTimeBR();

  // URL da Logo fornecida
  const logoUrl = "https://qacaerwosglbayjfskyx.supabase.co/storage/v1/object/public/templates/LogoSemFundo.png";

  const grouped: GroupedTasks = {};
  for (const t of tasks) {
    const key = groupBy === "executante" ? t.executante : t.setor;
    (grouped[key] ||= []).push(t);
  }
  const keys = groupBy === "setor" ? sortSetores(Object.keys(grouped)) : Object.keys(grouped).sort();

  let sections = "";
  if (keys.length === 0) {
    sections = `<p style="text-align:center; color:#64748b; font-style:italic; margin:40px 0; font-size: 14px;">Nenhuma atividade planejada para a semana.</p>`;
  } else {
    for (const key of keys) {
      const rows = grouped[key];
      const isExecutanteGroup = groupBy === "executante";

      const body = rows
        .map(
          (r, idx) => `
        <tr class="${idx % 2 === 0 ? "even" : "odd"}">
          <td class="text-cell font-medium">${r.descricao ?? ""}</td>
          ${isExecutanteGroup ? `<td class="text-cell">${r.setor ?? ""}</td>` : ""}
          <td class="text-cell">${r.disciplina ?? ""}</td>
          ${!isExecutanteGroup ? `<td class="text-cell">${r.executante ?? ""}</td>` : ""}
          <td class="text-cell">${r.responsavel ?? ""}</td>
          <td class="text-cell">${r.encarregado ?? ""}</td>
          <td class="day-cell">${getStatusHtml(r.seg)}</td>
          <td class="day-cell">${getStatusHtml(r.ter)}</td>
          <td class="day-cell">${getStatusHtml(r.qua)}</td>
          <td class="day-cell">${getStatusHtml(r.qui)}</td>
          <td class="day-cell">${getStatusHtml(r.sex)}</td>
          <td class="day-cell">${getStatusHtml(r.sab)}</td>
          <td class="day-cell">${getStatusHtml(r.dom)}</td>
        </tr>
      `,
        )
        .join("");

      const groupLabel = isExecutanteGroup ? "Executante" : "Setor";
      const groupValue = key || (isExecutanteGroup ? "Sem Executante" : "Sem Setor");

      sections += `
        <section class="sector">
          <div class="sector-header">
            <h2 class="sector-title">${groupLabel}: ${groupValue}</h2>
            <span class="sector-badge">${rows.length} itens</span>
          </div>

          <table class="data-table">
            <colgroup>
              ${
                isExecutanteGroup
                  ? `
                <col style="width:25%">
                <col style="width:12%">
                <col style="width:12%">
                <col style="width:10%">
                <col style="width:10%">
              `
                  : `
                <col style="width:25%">
                <col style="width:12%">
                <col style="width:12%">
                <col style="width:10%">
                <col style="width:10%">
              `
              }
              <col style="width:4.4%">
              <col style="width:4.4%">
              <col style="width:4.4%">
              <col style="width:4.4%">
              <col style="width:4.4%">
              <col style="width:4.4%">
              <col style="width:4.4%">
            </colgroup>

            <thead>
              <tr>
                <th>Atividade</th>
                ${isExecutanteGroup ? "<th>Setor</th>" : ""}
                <th>Disciplina</th>
                ${!isExecutanteGroup ? "<th>Executante</th>" : ""}
                <th>Resp.</th>
                <th>Enc.</th>
                ${DOW_PT.map((n) => `<th class="center">${n}</th>`).join("")}
              </tr>
            </thead>
            <tbody>${body}</tbody>
          </table>
        </section>
      `;
    }
  }

  // HTML + CSS com Cores da Grifo
  return `<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8" />
  <title>Relatório de Produção - ${obraNome}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    @page { margin: 10mm 10mm; size: A4 landscape; }
    
    body { 
      font-family: 'Inter', Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      font-size: 10px;
      line-height: 1.4;
      -webkit-print-color-adjust: exact; 
      print-color-adjust: exact;
      background-color: #ffffff;
    }

    /* Cores Grifo */
    :root {
      --grifo-dark: #0F1F2C;
      --grifo-gold: #EAB308;
      --grifo-gray: #f8fafc;
    }

    /* Header Seguro (Dentro da Margem) */
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 3px solid #EAB308; /* Linha Dourada da Grifo */
    }
    .logo-container img { height: 60px; width: auto; object-fit: contain; }
    
    .header-info { text-align: right; }
    .header-info h1 { margin: 0; font-size: 22px; font-weight: 800; color: #0F1F2C; text-transform: uppercase; letter-spacing: -0.5px; }
    .header-info p { margin: 4px 0 0; color: #64748b; font-size: 11px; font-weight: 500; }

    /* Sections */
    .sector { margin-bottom: 25px; page-break-inside: avoid; }
    .sector-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      padding-left: 4px;
      border-left: 4px solid #EAB308; /* Acento Dourado */
    }
    .sector-title { margin: 0; font-size: 14px; font-weight: 700; color: #0F1F2C; text-transform: uppercase; }
    .sector-badge { background: #f1f5f9; color: #64748b; font-size: 10px; padding: 2px 8px; border-radius: 12px; font-weight: 600; border: 1px solid #e2e8f0; }

    /* Table */
    .data-table { width: 100%; border-collapse: separate; border-spacing: 0; table-layout: fixed; }
    
    /* Cabeçalho da Tabela - Cores Grifo */
    .data-table th {
      background-color: #0F1F2C; /* Azul Escuro Grifo */
      color: #ffffff; /* Texto Branco */
      font-weight: 600;
      text-transform: uppercase;
      font-size: 9px;
      padding: 8px 6px;
      text-align: left;
      border-bottom: 2px solid #EAB308; /* Borda Dourada Inferior */
    }
    .data-table th:first-child { border-top-left-radius: 4px; }
    .data-table th:last-child { border-top-right-radius: 4px; }
    .data-table th.center { text-align: center; }
    
    .data-table td {
      padding: 6px 5px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top; /* Melhor para textos longos */
      font-size: 10px;
      color: #334155;
    }
    
    /* Zebrado */
    .data-table tr:nth-child(even) { background-color: #f8fafc; }
    .data-table tr:hover { background-color: #f1f5f9; }

    .text-cell { 
      word-wrap: break-word; 
      white-space: normal;
      line-height: 1.3;
    }
    .font-medium { font-weight: 600; color: #0F1F2C; }
    
    .day-cell { 
      text-align: center; 
      font-size: 12px; 
      border-left: 1px solid #f1f5f9; /* Separador sutil entre dias */
    }

    /* Footer */
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      font-size: 9px;
      color: #94a3b8;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      background: white;
    }
    .legend { display: flex; justify-content: flex-end; gap: 20px; margin-top: 10px; font-size: 10px; color: #475569; padding-right: 10px; }
    .legend span { display: inline-flex; align-items: center; gap: 6px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="report-header">
    <div class="logo-container">
      <img src="${logoUrl}" alt="Grifo Engenharia" />
    </div>
    <div class="header-info">
      <h1>Relatório de Planejamento Semanal</h1>
      <p><strong>Obra:</strong> ${obraNome} &nbsp;|&nbsp; <strong>Período:</strong> ${formatDateRange(weekStart, weekEnd)}</p>
      <p>Gerado em: ${currentDate} às ${currentTime}</p>
    </div>
  </div>

  <div class="legend">
    <span><strong style="color:#166534">✓</strong> Executada</span>
    <span><strong style="color:#dc2626">×</strong> Não Feita</span>
    <span><strong style="color:#94a3b8">•</strong> Planejada</span>
  </div>

  ${sections}

  <div class="footer">
    Grifoboard - Sistema Integrado de Gestão
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!; // USANDO ANON KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Variáveis de ambiente do Supabase ausentes.");
    }

    // Auth Check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized - No token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized - Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[export-pdf] Export solicitado por: ${user.id}`);

    // Parse Body
    const body = await req.json();
    let { obraId, obraNome, weekStart, groupBy = "setor", executante = "" } = body;

    if (!obraId || !weekStart) {
      return new Response(JSON.stringify({ error: "Dados incompletos (obraId/weekStart)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Busca Obra
    const { data: obra, error: obraError } = await supabase.from("obras").select("nome_obra").eq("id", obraId).single();

    if (obraError || !obra) {
      return new Response(JSON.stringify({ error: "Obra não encontrada ou acesso negado." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!obraNome) obraNome = obra.nome_obra || "Obra";

    // Busca Tarefas
    let query = supabase
      .from("tarefas")
      .select("setor, descricao, disciplina, executante, responsavel, encarregado, seg, ter, qua, qui, sex, sab, dom")
      .eq("obra_id", obraId)
      .eq("semana", weekStart);

    if (groupBy === "executante" && executante) {
      query = query.eq("executante", executante);
    }

    query = query
      .order(groupBy === "executante" ? "executante" : "setor", { ascending: true })
      .order("descricao", { ascending: true });

    const { data: tasks, error } = await query;
    if (error) throw error;

    // Período
    const weekStartDate = new Date(weekStart + "T00:00:00");
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    const html = await generateHtmlContent(tasks || [], obraNome, weekStartDate, weekEndDate, groupBy, executante);

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    console.error("Erro interno:", e);
    return new Response(JSON.stringify({ error: e?.message || "Erro inesperado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
