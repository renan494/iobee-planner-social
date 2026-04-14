import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { client, format, funnelStage, channels, theme } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const formatLabels: Record<string, string> = {
      static: "Estático (imagem única)",
      carousel: "Carrossel (múltiplas imagens)",
      reels: "Reels (vídeo curto)",
      stories: "Stories",
    };

    const funnelLabels: Record<string, string> = {
      topo: "Topo de funil (awareness, alcance)",
      meio: "Meio de funil (consideração, engajamento)",
      fundo: "Fundo de funil (conversão, vendas)",
    };

    const systemPrompt = `Você é um social media copywriter brasileiro especialista em marketing digital.
Sua tarefa é gerar conteúdo para posts de redes sociais.
Responda SEMPRE usando tool calling com a função fornecida.
Use linguagem profissional mas acessível. Adapte o tom ao cliente e ao formato.`;

    const userPrompt = `Gere um post completo para redes sociais com as seguintes informações:
- Cliente: ${client || "não especificado"}
- Formato: ${formatLabels[format] || format || "não especificado"}
- Etapa do funil: ${funnelLabels[funnelStage] || funnelStage || "não especificado"}
- Canais: ${channels?.length ? channels.join(", ") : "não especificado"}
${theme ? `- Tema/Assunto: ${theme}` : ""}

Gere um título curto e impactante, uma legenda completa com emojis e CTA, e 3 a 5 hashtags relevantes (sem o #).`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "create_post",
                description: "Creates a social media post with title, legend, and hashtags.",
                parameters: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                      description: "Short, impactful post title (max 80 chars)",
                    },
                    legend: {
                      type: "string",
                      description:
                        "Full post caption/legend with emojis and CTA (max 2000 chars)",
                    },
                    hashtags: {
                      type: "array",
                      items: { type: "string" },
                      description: "3 to 5 relevant hashtags without the # symbol",
                    },
                  },
                  required: ["title", "legend", "hashtags"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "create_post" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured response from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-post error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
