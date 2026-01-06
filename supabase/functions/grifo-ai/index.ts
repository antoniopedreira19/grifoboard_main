import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// --- CONFIGURAÇÃO ---
// ATENÇÃO: Certifique-se que esta URL é a de PRODUÇÃO do n8n, não a de Teste.
// A URL de teste só funciona se você estiver com a janela do n8n aberta e clicar em "Execute".
const N8N_WEBHOOK_URL = "https://grifoworkspace.app.n8n.cloud/webhook/grifomind";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Debug: Ver o que o Frontend mandou
    const reqText = await req.text();
    console.log("🔹 [Edge] Corpo da requisição recebido:", reqText);

    if (!reqText) {
      throw new Error("O corpo da requisição chegou vazio no Supabase.");
    }

    const { query, user_id, chat_id } = JSON.parse(reqText);

    // 2. Enviar para o n8n
    console.log(`🔹 [Edge] Enviando para n8n (${N8N_WEBHOOK_URL})...`);

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: query, // O n8n espera 'text' ou 'message'
        chat_id: chat_id,
        user_id: user_id,
      }),
    });

    // 3. Debug: Ler a resposta do n8n como TEXTO puro antes de tentar JSON
    const responseText = await response.text();
    console.log("🔹 [Edge] Resposta bruta do n8n:", responseText);

    if (!response.ok) {
      throw new Error(`Erro HTTP do n8n: ${response.status} - ${responseText}`);
    }

    if (!responseText) {
      throw new Error("O n8n retornou uma resposta vazia. Verifique se o nó 'Respond to Webhook' foi executado.");
    }

    // 4. Tentar converter para JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`O n8n não retornou um JSON válido. Retornou: "${responseText.substring(0, 100)}..."`);
    }

    // Verifica se a mensagem existe na resposta
    const answer = data.message || data.output || "O n8n respondeu, mas sem o campo 'message'.";

    return new Response(JSON.stringify({ answer: answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("🔴 [Edge Error]:", error.message);

    return new Response(
      JSON.stringify({
        error: error.message,
        hint: "Verifique os logs do Supabase e a aba 'Executions' do n8n.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
