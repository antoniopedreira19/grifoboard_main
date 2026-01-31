import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// --- CONFIGURAÇÃO ---
const N8N_WEBHOOK_URL = "https://grifoworkspace.app.n8n.cloud/webhook/grifomind";
const TIMEOUT_MS = 55000; // 55 seconds (leaving 5s buffer for response)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`🔹 [${requestId}] Nova requisição recebida`);

  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Parse request body
    const reqText = await req.text();
    console.log(`🔹 [${requestId}] Corpo da requisição:`, reqText.substring(0, 200));

    if (!reqText) {
      throw new Error("O corpo da requisição chegou vazio.");
    }

    const { query, user_id, chat_id } = JSON.parse(reqText);
    console.log(`🔹 [${requestId}] Query: "${query?.substring(0, 50)}..." | User: ${user_id}`);

    // 2. Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`⏱️ [${requestId}] Timeout atingido (${TIMEOUT_MS}ms)`);
      controller.abort();
    }, TIMEOUT_MS);

    // 3. Call n8n webhook
    console.log(`🔹 [${requestId}] Enviando para n8n...`);
    const startTime = Date.now();

    let response: Response;
    try {
      response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: query,
          chat_id: chat_id,
          user_id: user_id,
        }),
        signal: controller.signal,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === "AbortError") {
        console.log(`⏱️ [${requestId}] Requisição abortada por timeout`);
        return new Response(
          JSON.stringify({
            error: "Timeout: O servidor demorou muito para responder.",
            hint: "O n8n pode estar sobrecarregado. Tente novamente.",
          }),
          {
            status: 504,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      throw fetchError;
    }

    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;
    console.log(`🔹 [${requestId}] Resposta do n8n em ${elapsed}ms | Status: ${response.status}`);

    // 4. Read response
    const responseText = await response.text();
    console.log(`🔹 [${requestId}] Resposta bruta (primeiros 200 chars):`, responseText.substring(0, 200));

    if (!response.ok) {
      throw new Error(`Erro HTTP do n8n: ${response.status} - ${responseText.substring(0, 100)}`);
    }

    if (!responseText) {
      throw new Error("O n8n retornou uma resposta vazia.");
    }

    // 5. Parse JSON response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`O n8n não retornou um JSON válido. Retornou: "${responseText.substring(0, 100)}..."`);
    }

    const answer = data.message || data.output || "O n8n respondeu, mas sem o campo 'message'.";
    console.log(`✅ [${requestId}] Sucesso! Resposta tem ${answer.length} caracteres`);

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(`🔴 [${requestId}] Erro:`, error.message);

    return new Response(
      JSON.stringify({
        error: error.message,
        hint: "Verifique os logs do Supabase e a aba 'Executions' do n8n.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
