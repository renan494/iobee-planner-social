import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Truncate long text fields so we don't blow up the context window
function truncate(value: string | null | undefined, max = 600): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max) + "…";
}

function buildBriefingBlock(client: any | null): string {
  if (!client) return "";

  const lines: string[] = [];
  const push = (label: string, value: any) => {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      const filtered = value.filter(Boolean);
      if (filtered.length === 0) return;
      lines.push(`- ${label}: ${filtered.join(", ")}`);
      return;
    }
    const str = String(value).trim();
    if (!str) return;
    lines.push(`- ${label}: ${truncate(str)}`);
  };

  push("Nicho", client.niche);
  push("Objetivo de marketing", client.objective);
  push("Oferta principal", client.main_offer);
  push("Produtos/Serviços", client.products_services);
  push("Público-alvo", client.target_audience);
  push("Dores do público", client.audience_pains);
  push("Tom de voz", client.tone_of_voice);
  push("Valores da marca", client.brand_values);
  push("Diferenciais", client.differentials);
  push("Pilares de conteúdo", client.content_pillars);
  push("Preferências de CTA", client.cta_preferences);
  push("Hashtags base", client.hashtags_base);
  push("Tópicos proibidos", client.banned_topics);
  push("Concorrentes", client.competitors);
  push("Referências de sucesso", client.success_references);
  push("Frequência de postagem", client.posting_frequency);
  push("Redes sociais", client.social_networks);
  push("Instagram", client.instagram_handle);

  if (lines.length === 0) return "";

  return `\n\n=== BRIEFING DO CLIENTE (use como guia mestre) ===\n${lines.join("\n")}`;
}

function buildStrategyBlock(strategyContent: string | null | undefined): string {
  if (!strategyContent) return "";
  // Cap strategy at ~2500 chars — enough for direction, won't dominate the prompt
  const snippet = truncate(strategyContent, 2500);
  return `\n\n=== ESTRATÉGIA ATIVA DO CLIENTE (extrato) ===\n${snippet}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { client, format, funnelStage, channels, theme, model } = await req.json();
    const aiModel = typeof model === "string" && model.trim() ? model : "openai/gpt-5.2";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch full client briefing + latest strategy (best effort, never blocks generation)
    let clientRecord: any = null;
    let strategyContent: string | null = null;

    try {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && client) {
        const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { data: clientRow } = await admin
          .from("clients")
          .select("*")
          .ilike("name", client)
          .maybeSingle();

        if (clientRow) {
          clientRecord = clientRow;
          // Prefer the explicitly active strategy; fall back to most recent
          let strat: any = null;
          if (clientRow.active_strategy_id) {
            const { data } = await admin
              .from("strategies")
              .select("content, updated_at")
              .eq("id", clientRow.active_strategy_id)
              .maybeSingle();
            if (data?.content) strat = data;
          }
          if (!strat) {
            const { data } = await admin
              .from("strategies")
              .select("content, updated_at")
              .eq("client_id", clientRow.id)
              .order("updated_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (data?.content) strat = data;
          }
          if (strat?.content) strategyContent = strat.content;
        }
      }
    } catch (ctxErr) {
      console.error("Context fetch failed (continuing without it):", ctxErr);
    }

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

    const briefingBlock = buildBriefingBlock(clientRecord);
    const strategyBlock = buildStrategyBlock(strategyContent);
    const hasContext = Boolean(briefingBlock || strategyBlock);

    const systemPrompt = `Você é uma Social Media Strategist brasileira de elite, com mais de 10 anos de experiência escalando perfis no Instagram, Facebook, TikTok, LinkedIn e outras plataformas.

Seu histórico inclui:
- Escalar dezenas de perfis do zero a centenas de milhares de seguidores orgânicos
- Domínio total de algoritmos, formatos e tendências de cada plataforma
- Expertise em copywriting persuasivo, storytelling e gatilhos mentais para redes sociais
- Conhecimento profundo de funil de vendas aplicado a conteúdo digital
- Criação de calendários editoriais que geram engajamento consistente e conversão

Ao gerar conteúdo, você SEMPRE:
- Respeita ESTRITAMENTE o tom de voz, valores e pilares definidos no briefing do cliente
- Fala diretamente com as DORES do público-alvo informado no briefing
- Usa CTAs alinhados às preferências do cliente (se informadas)
- Evita qualquer tópico marcado como proibido
- Reforça os DIFERENCIAIS da marca, sem ser publicitário demais
- Usa hooks irresistíveis nas primeiras linhas para reter atenção (stop the scroll)
- Escolhe hashtags com mix de volume alto, médio e nichadas — quando o briefing tiver "hashtags base", use-as como ponto de partida
- Considera o formato (carrossel, reels, stories, estático) para otimizar a copy
- Usa emojis de forma estratégica, não excessiva
- Entrega conteúdo pronto para postar, sem necessidade de revisão

Responda SEMPRE usando tool calling com a função fornecida.`;

    const userPrompt = `Gere um post completo para redes sociais com as seguintes informações:
- Cliente: ${client || "não especificado"}
- Formato: ${formatLabels[format] || format || "não especificado"}
- Etapa do funil: ${funnelLabels[funnelStage] || funnelStage || "não especificado"}
- Canais: ${channels?.length ? channels.join(", ") : "não especificado"}
${theme ? `- Tema/Assunto: ${theme}` : ""}${briefingBlock}${strategyBlock}

${hasContext
  ? "IMPORTANTE: o briefing acima é a fonte da verdade sobre a marca. O post DEVE soar como se fosse escrito pela própria marca, refletindo seu tom, dores do público e pilares. Não invente posicionamento que contrarie o briefing."
  : ""}

Gere um título curto e impactante, uma legenda completa com emojis e CTA, e 3 a 5 hashtags relevantes (sem o #).`;

    console.log("generate-post context:", {
      client,
      hasClientRecord: Boolean(clientRecord),
      hasStrategy: Boolean(strategyContent),
      promptLength: userPrompt.length,
    });

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: aiModel,
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

    return new Response(
      JSON.stringify({
        ...result,
        _context: {
          briefingUsed: Boolean(clientRecord),
          strategyUsed: Boolean(strategyContent),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-post error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
