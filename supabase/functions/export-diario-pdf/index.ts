import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExportRequest {
  obraId: string;
  obraNome: string;
  exportType: "day" | "week";
  date: string; // ISO date string (YYYY-MM-DD)
  includePhotos: boolean;
}

interface DiarioRecord {
  id: string;
  data: string;
  clima: string | null;
  mao_de_obra: string | null;
  equipamentos: string | null;
  atividades: string;
  ocorrencias: string | null;
  observacoes: string | null;
}

interface FotoRecord {
  id: string;
  path: string;
  legenda: string | null;
  criado_em: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body: ExportRequest = await req.json();
    const { obraId, obraNome, exportType, date, includePhotos } = body;

    if (!obraId || !date) {
      return new Response(JSON.stringify({ error: "obraId and date are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate date range
    let startDate: string;
    let endDate: string;

    if (exportType === "week") {
      // Get Monday of the week containing the selected date
      const selectedDate = new Date(date + "T12:00:00Z");
      const dayOfWeek = selectedDate.getUTCDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      
      const monday = new Date(selectedDate);
      monday.setUTCDate(selectedDate.getUTCDate() + mondayOffset);
      
      const sunday = new Date(monday);
      sunday.setUTCDate(monday.getUTCDate() + 6);
      
      startDate = monday.toISOString().split("T")[0];
      endDate = sunday.toISOString().split("T")[0];
    } else {
      startDate = date;
      endDate = date;
    }

    console.log(`[export-diario-pdf] Exporting from ${startDate} to ${endDate} for obra ${obraId}`);

    // Fetch diarios in range
    const { data: diarios, error: diariosError } = await supabase
      .from("diarios_obra")
      .select("id, data, clima, mao_de_obra, equipamentos, atividades, ocorrencias, observacoes")
      .eq("obra_id", obraId)
      .gte("data", startDate)
      .lte("data", endDate)
      .order("data", { ascending: true });

    if (diariosError) {
      console.error("[export-diario-pdf] Error fetching diarios:", diariosError);
      throw diariosError;
    }

    console.log(`[export-diario-pdf] Found ${diarios?.length || 0} diarios`);

    // For each diario, fetch photos if requested
    const diariosWithPhotos: Array<{
      diario: DiarioRecord;
      photos: Array<FotoRecord & { url: string }>;
    }> = [];

    for (const diario of diarios || []) {
      let photos: Array<FotoRecord & { url: string }> = [];

      if (includePhotos) {
        const { data: fotosData, error: fotosError } = await supabase
          .from("diario_fotos")
          .select("id, path, legenda, criado_em")
          .eq("obra_id", obraId)
          .eq("data", diario.data)
          .order("criado_em", { ascending: true });

        if (fotosError) {
          console.error("[export-diario-pdf] Error fetching photos:", fotosError);
        } else if (fotosData && fotosData.length > 0) {
          // Generate signed URLs for each photo
          for (const foto of fotosData) {
            const { data: signedData, error: signedError } = await supabase.storage
              .from("diario-obra")
              .createSignedUrl(foto.path, 3600); // 1 hour expiry

            if (!signedError && signedData) {
              photos.push({
                ...foto,
                url: signedData.signedUrl,
              });
            }
          }
        }
      }

      diariosWithPhotos.push({ diario, photos });
    }

    // Generate HTML
    const html = generateHTML(obraNome, startDate, endDate, exportType, diariosWithPhotos);

    return new Response(JSON.stringify({ html }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("[export-diario-pdf] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateHTML(
  obraNome: string,
  startDate: string,
  endDate: string,
  exportType: "day" | "week",
  diariosWithPhotos: Array<{ diario: DiarioRecord; photos: Array<FotoRecord & { url: string }> }>
): string {
  const formatDateBR = (dateStr: string): string => {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const formatDateLong = (dateStr: string): string => {
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const weekDays = [
      "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
      "Quinta-feira", "Sexta-feira", "Sábado"
    ];
    
    const date = new Date(dateStr + "T12:00:00Z");
    const dayOfWeek = weekDays[date.getUTCDay()];
    const day = date.getUTCDate();
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    
    return `${dayOfWeek}, ${day} de ${month} de ${year}`;
  };

  const parseClima = (climaStr: string | null): { manha: string; tarde: string; noite: string } => {
    if (!climaStr) return { manha: "-", tarde: "-", noite: "-" };
    try {
      const parsed = JSON.parse(climaStr);
      return {
        manha: parsed.manha || "-",
        tarde: parsed.tarde || "-",
        noite: parsed.noite || "-",
      };
    } catch {
      return { manha: climaStr || "-", tarde: "-", noite: "-" };
    }
  };

  const getClimaEmoji = (clima: string): string => {
    const lower = clima.toLowerCase();
    if (lower.includes("ensolarado")) return "☀️";
    if (lower.includes("nublado")) return "☁️";
    if (lower.includes("chuvoso")) return "🌧️";
    if (lower.includes("variável")) return "🌤️";
    if (lower.includes("impraticável")) return "⛈️";
    return "";
  };

  const periodo = exportType === "day" 
    ? formatDateBR(startDate)
    : `${formatDateBR(startDate)} a ${formatDateBR(endDate)}`;

  let diariosHTML = "";

  if (diariosWithPhotos.length === 0) {
    diariosHTML = `
      <div class="no-data">
        <p>Nenhum diário registrado para o período selecionado.</p>
      </div>
    `;
  } else {
    for (const { diario, photos } of diariosWithPhotos) {
      const clima = parseClima(diario.clima);
      
      let photosHTML = "";
      if (photos.length > 0) {
        const photoItems = photos.map(photo => `
          <div class="photo-item">
            <img src="${photo.url}" alt="Foto do diário" />
            ${photo.legenda ? `<p class="photo-caption">${photo.legenda}</p>` : ""}
          </div>
        `).join("");
        
        photosHTML = `
          <div class="section photos-section">
            <h3>📷 Fotos do Dia</h3>
            <div class="photos-grid">
              ${photoItems}
            </div>
          </div>
        `;
      }

      diariosHTML += `
        <div class="day-container">
          <h2 class="day-title">📅 ${formatDateLong(diario.data)}</h2>
          
          <div class="section clima-section">
            <h3>☀️ Clima</h3>
            <div class="clima-grid">
              <div class="clima-item">
                <span class="clima-label">🌅 Manhã:</span>
                <span class="clima-value">${getClimaEmoji(clima.manha)} ${clima.manha}</span>
              </div>
              <div class="clima-item">
                <span class="clima-label">🌇 Tarde:</span>
                <span class="clima-value">${getClimaEmoji(clima.tarde)} ${clima.tarde}</span>
              </div>
              <div class="clima-item">
                <span class="clima-label">🌙 Noite:</span>
                <span class="clima-value">${getClimaEmoji(clima.noite)} ${clima.noite}</span>
              </div>
            </div>
          </div>
          
          ${diario.mao_de_obra ? `
            <div class="section">
              <h3>👷 Mão de Obra</h3>
              <p>${diario.mao_de_obra.replace(/\n/g, "<br>")}</p>
            </div>
          ` : ""}
          
          ${diario.equipamentos ? `
            <div class="section">
              <h3>🔧 Equipamentos</h3>
              <p>${diario.equipamentos.replace(/\n/g, "<br>")}</p>
            </div>
          ` : ""}
          
          <div class="section">
            <h3>📋 Atividades Realizadas</h3>
            <p>${diario.atividades.replace(/\n/g, "<br>")}</p>
          </div>
          
          ${diario.ocorrencias ? `
            <div class="section">
              <h3>⚠️ Ocorrências</h3>
              <p>${diario.ocorrencias.replace(/\n/g, "<br>")}</p>
            </div>
          ` : ""}
          
          ${diario.observacoes ? `
            <div class="section">
              <h3>📝 Observações</h3>
              <p>${diario.observacoes.replace(/\n/g, "<br>")}</p>
            </div>
          ` : ""}
          
          ${photosHTML}
        </div>
      `;
    }
  }

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diário de Obra - ${obraNome}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #1a1a1a;
      background: white;
      padding: 20px;
      margin: 0;
    }
    
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid #C7A347;
      padding-bottom: 20px;
      margin-bottom: 20px;
      page-break-after: avoid;
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    
    .logo {
      width: 80px;
      height: auto;
    }
    
    .header-info h1 {
      font-size: 24pt;
      color: #1a1a1a;
      font-weight: 700;
    }
    
    .header-info p {
      font-size: 11pt;
      color: #666;
      margin-top: 4px;
    }
    
    .header-right {
      text-align: right;
    }
    
    .header-right .obra-name {
      font-size: 14pt;
      font-weight: 600;
      color: #C7A347;
    }
    
    .header-right .periodo {
      font-size: 10pt;
      color: #666;
      margin-top: 4px;
    }
    
    .day-container {
      margin-bottom: 30px;
      page-break-before: auto;
      page-break-inside: avoid;
    }
    
    .day-container:first-child {
      page-break-before: avoid;
    }
    
    .day-title {
      font-size: 16pt;
      color: #1a1a1a;
      background: #f8f8f8;
      padding: 12px 16px;
      border-left: 4px solid #C7A347;
      margin-bottom: 16px;
      page-break-after: avoid;
    }
    
    .section {
      margin-bottom: 16px;
      padding: 12px 16px;
      background: #fafafa;
      border-radius: 8px;
    }
    
    .section h3 {
      font-size: 11pt;
      color: #C7A347;
      font-weight: 600;
      margin-bottom: 8px;
      border-bottom: 1px solid #eee;
      padding-bottom: 6px;
    }
    
    .section p {
      font-size: 10pt;
      color: #333;
    }
    
    .clima-section {
      background: #f0f7ff;
    }
    
    .clima-grid {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }
    
    .clima-item {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    
    .clima-label {
      font-size: 10pt;
      color: #666;
    }
    
    .clima-value {
      font-size: 10pt;
      color: #333;
      font-weight: 500;
    }
    
    .photos-section {
      page-break-inside: avoid;
    }
    
    .photos-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    
    .photo-item {
      text-align: center;
    }
    
    .photo-item img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid #ddd;
    }
    
    .photo-caption {
      font-size: 8pt;
      color: #666;
      margin-top: 4px;
      font-style: italic;
    }
    
    .no-data {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }
    
    .no-data p {
      font-size: 12pt;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 9pt;
      color: #999;
    }
    
    @media print {
      html, body {
        padding: 0;
        margin: 0;
      }
      
      .header {
        page-break-after: avoid;
      }
      
      .day-container {
        page-break-before: auto;
        page-break-inside: avoid;
      }
      
      .day-container:first-child {
        page-break-before: avoid;
      }
      
      .photos-grid {
        grid-template-columns: repeat(3, 1fr);
      }
      
      .photo-item img {
        height: 120px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <img src="https://grifoboardd.lovable.app/lovable-uploads/grifo-logo-header.png" alt="Grifo" class="logo" />
      <div class="header-info">
        <h1>Diário de Obra</h1>
        <p>Registro de atividades e ocorrências</p>
      </div>
    </div>
    <div class="header-right">
      <p class="obra-name">${obraNome}</p>
      <p class="periodo">Período: ${periodo}</p>
    </div>
  </div>
  
  ${diariosHTML}
  
  <div class="footer">
    <p>Documento gerado automaticamente pelo Sistema Grifo Board</p>
    <p>Data de geração: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
  </div>
</body>
</html>
  `;
}
