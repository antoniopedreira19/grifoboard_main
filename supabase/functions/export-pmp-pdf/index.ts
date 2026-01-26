import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PmpAtividade {
  id: string;
  titulo: string;
  cor: string;
  responsavel: string | null;
  concluido: boolean;
  setor: string | null;
  data_inicio: string | null;
  data_termino: string | null;
}

interface WeekData {
  weekId: string;
  label: string;
  formattedRange: string;
  atividades: PmpAtividade[];
}

function getCurrentDateTimeBR(): { date: string; time: string } {
  const now = new Date();
  const brazilTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  return {
    date: brazilTime.toLocaleDateString("pt-BR"),
    time: brazilTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

// Map of color keys to actual color values
const COLOR_MAP: Record<string, string> = {
  yellow: "#facc15",
  green: "#10b981",
  blue: "#3b82f6",
  red: "#ef4444",
  purple: "#a855f7",
  orange: "#f97316",
  pink: "#ec4899",
  cyan: "#06b6d4",
  lime: "#84cc16",
  indigo: "#6366f1",
  amber: "#f59e0b",
  teal: "#14b8a6",
};

// Maximum activities per week card before splitting
const MAX_ATIVIDADES_PER_CARD = 12;

function generateHtmlContent(
  weeksData: WeekData[],
  obraNome: string,
): string {
  const { date: currentDate, time: currentTime } = getCurrentDateTimeBR();
  const logoUrl = "https://qacaerwosglbayjfskyx.supabase.co/storage/v1/object/public/templates/LogoSemFundo.png";

  // Split weeks with many activities into multiple cards
  interface WeekCardData {
    weekId: string;
    label: string;
    formattedRange: string;
    atividades: PmpAtividade[];
    totalAtividades: number;
    totalConcluidas: number;
    partNumber?: number;
    totalParts?: number;
  }

  const expandedWeeks: WeekCardData[] = [];
  
  for (const week of weeksData) {
    const totalAtividades = week.atividades.length;
    const totalConcluidas = week.atividades.filter(a => a.concluido).length;
    
    if (totalAtividades <= MAX_ATIVIDADES_PER_CARD) {
      expandedWeeks.push({
        ...week,
        totalAtividades,
        totalConcluidas,
      });
    } else {
      // Split into multiple cards
      const numParts = Math.ceil(totalAtividades / MAX_ATIVIDADES_PER_CARD);
      for (let i = 0; i < numParts; i++) {
        const start = i * MAX_ATIVIDADES_PER_CARD;
        const end = start + MAX_ATIVIDADES_PER_CARD;
        expandedWeeks.push({
          weekId: week.weekId,
          label: week.label,
          formattedRange: week.formattedRange,
          atividades: week.atividades.slice(start, end),
          totalAtividades,
          totalConcluidas,
          partNumber: i + 1,
          totalParts: numParts,
        });
      }
    }
  }

  // Generate week cards in groups of 3
  let boardHtml = "";
  
  for (let i = 0; i < expandedWeeks.length; i += 3) {
    const rowWeeks = expandedWeeks.slice(i, i + 3);
    
    boardHtml += `<div class="week-row">`;
    
    for (const week of rowWeeks) {
      const partLabel = week.totalParts && week.totalParts > 1 
        ? ` (${week.partNumber}/${week.totalParts})` 
        : '';
      
      const atividadesHtml = week.atividades.length > 0 
        ? week.atividades.map(ativ => {
            const borderColor = COLOR_MAP[ativ.cor] || COLOR_MAP.yellow;
            const statusIcon = ativ.concluido 
              ? '<span class="status-done">✓</span>' 
              : '<span class="status-pending">○</span>';
            
            return `
              <div class="atividade-card" style="border-left-color: ${borderColor};">
                <div class="atividade-header">
                  ${statusIcon}
                  <span class="atividade-titulo">${ativ.titulo}</span>
                </div>
                ${ativ.responsavel ? `<div class="atividade-responsavel">👤 ${ativ.responsavel}</div>` : ''}
                ${ativ.setor ? `<div class="atividade-setor">📍 ${ativ.setor}</div>` : ''}
              </div>
            `;
          }).join('')
        : '<div class="no-atividades">Nenhuma atividade</div>';
      
      boardHtml += `
        <div class="week-card">
          <div class="week-header">
            <span class="week-label">${week.label}${partLabel}</span>
            <span class="week-range">${week.formattedRange}</span>
          </div>
          <div class="week-body">
            ${atividadesHtml}
          </div>
          <div class="week-footer">
            <span class="count">${week.totalAtividades} ${week.totalAtividades === 1 ? 'atividade' : 'atividades'}</span>
            <span class="done-count">${week.totalConcluidas} concluídas</span>
          </div>
        </div>
      `;
    }
    
    // Fill empty slots if row has less than 3
    for (let j = rowWeeks.length; j < 3; j++) {
      boardHtml += `<div class="week-card empty"></div>`;
    }
    
    boardHtml += `</div>`;
  }

  return `<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8" />
  <title>PMP - ${obraNome}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    @page { margin: 10mm; size: A4 landscape; }
    
    * { box-sizing: border-box; }
    
    body { 
      font-family: 'Inter', Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 20px;
      font-size: 10px;
      line-height: 1.4;
      -webkit-print-color-adjust: exact; 
      print-color-adjust: exact;
      background-color: #f8fafc;
    }

    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 3px solid #EAB308;
    }
    
    .logo-container img { height: 50px; width: auto; object-fit: contain; }
    
    .header-info { text-align: right; }
    .header-info h1 { margin: 0; font-size: 18px; font-weight: 800; color: #0F1F2C; text-transform: uppercase; letter-spacing: -0.5px; }
    .header-info p { margin: 4px 0 0; color: #64748b; font-size: 10px; font-weight: 500; }

    .board-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .week-row {
      display: flex;
      gap: 12px;
    }

    .week-card {
      flex: 1;
      min-width: 0;
      background: white;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      break-inside: avoid;
    }
    
    .week-card.empty {
      background: transparent;
      border: none;
    }

    .week-header {
      background: #0F1F2C;
      color: white;
      padding: 8px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .week-label {
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
    }

    .week-range {
      font-size: 9px;
      opacity: 0.8;
    }

    .week-body {
      flex: 1;
      padding: 8px;
      min-height: 80px;
    }

    .week-footer {
      background: #f8fafc;
      padding: 6px 10px;
      font-size: 9px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #e2e8f0;
    }

    .done-count {
      color: #16a34a;
      font-weight: 600;
    }

    .atividade-card {
      background: #fafafa;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #facc15;
      border-radius: 4px;
      padding: 6px 8px;
      margin-bottom: 6px;
      font-size: 9px;
    }

    .atividade-header {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .atividade-titulo {
      font-weight: 600;
      color: #0F1F2C;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .status-done {
      color: #16a34a;
      font-weight: bold;
    }

    .status-pending {
      color: #94a3b8;
    }

    .atividade-responsavel,
    .atividade-setor {
      font-size: 8px;
      color: #64748b;
      margin-top: 2px;
    }

    .no-atividades {
      color: #94a3b8;
      font-style: italic;
      text-align: center;
      padding: 20px 0;
      font-size: 9px;
    }

    .footer {
      margin-top: 20px;
      font-size: 9px;
      color: #94a3b8;
      text-align: center;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="report-header">
    <div class="logo-container">
      <img src="${logoUrl}" alt="Grifo Engenharia" />
    </div>
    <div class="header-info">
      <h1>Planejamento Mestre da Produção</h1>
      <p><strong>Obra:</strong> ${obraNome}</p>
      <p>Gerado em: ${currentDate} às ${currentTime}</p>
    </div>
  </div>

  <div class="board-container">
    ${boardHtml}
  </div>

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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Variáveis de ambiente do Supabase ausentes.");
    }

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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized - Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[export-pmp-pdf] Export solicitado por: ${user.id}`);

    const body = await req.json();
    const { obraId, obraNome, weeks } = body as { 
      obraId: string; 
      obraNome: string; 
      weeks: WeekData[];
    };

    if (!obraId || !weeks || !Array.isArray(weeks)) {
      return new Response(JSON.stringify({ error: "Dados incompletos (obraId/weeks)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch atividades for the specified weeks
    const weekIds = weeks.map(w => w.weekId);
    
    const { data: atividades, error: atividadesError } = await supabase
      .from("pmp_atividades")
      .select("id, titulo, cor, responsavel, concluido, setor, data_inicio, data_termino, semana_referencia")
      .eq("obra_id", obraId)
      .order("ordem", { ascending: true });

    if (atividadesError) {
      console.error("Error fetching atividades:", atividadesError);
      throw atividadesError;
    }

    // Map atividades to weeks
    const weeksData: WeekData[] = weeks.map(week => {
      const weekAtividades = (atividades || []).filter(ativ => {
        // Check if atividade belongs to this week
        if (!ativ.data_inicio) {
          return ativ.semana_referencia === week.weekId;
        }
        
        // Parse dates and check overlap
        const atStart = new Date(ativ.data_inicio);
        const atEnd = ativ.data_termino ? new Date(ativ.data_termino) : atStart;
        const weekStart = new Date(week.weekId);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        return (atStart <= weekEnd && atEnd >= weekStart);
      });

      return {
        weekId: week.weekId,
        label: week.label,
        formattedRange: week.formattedRange,
        atividades: weekAtividades,
      };
    });

    const html = generateHtmlContent(weeksData, obraNome || "Obra");

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
