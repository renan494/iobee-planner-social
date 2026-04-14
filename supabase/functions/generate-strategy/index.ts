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
    const { client } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!client?.name) {
      return new Response(
        JSON.stringify({ error: "Nome do cliente é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Você é uma Estrategista Digital de Elite, com mais de 15 anos de experiência em planejamento estratégico de redes sociais para marcas no Brasil e no mundo.

Seu histórico inclui:
- Planejamento estratégico para centenas de marcas de diversos segmentos
- Domínio completo de todas as plataformas digitais e seus algoritmos
- Expertise em análise de concorrência e benchmarking de mercado
- Conhecimento profundo de métricas, KPIs e dados estatísticos de redes sociais
- Criação de linhas editoriais que geram crescimento orgânico sustentável
- Domínio de tendências, formatos e melhores práticas atualizadas

REGRAS OBRIGATÓRIAS:
1. SEMPRE inclua referências de mercado REAIS com fonte e dados estatísticos (ex: "Segundo pesquisa da HubSpot 2025, vídeos curtos geram 2x mais engajamento...")
2. SEMPRE cite fontes confiáveis (HubSpot, Hootsuite, Sprout Social, Meta Business, Social Media Examiner, Statista, etc.)
3. Seja específico nos números e percentuais
4. Adapte a estratégia ao nicho, público e tom de voz do cliente
5. Sugira posts concretos com títulos e formatos
6. Analise pontos fortes e fracos dos concorrentes mencionados
7. Forneça um calendário editorial quantitativo
8. Use markdown para formatar o documento de forma clara e profissional

Responda SEMPRE em português brasileiro.`;

    const clientInfo = [
      `**Cliente:** ${client.name}`,
      client.niche ? `**Nicho/Segmento:** ${client.niche}` : null,
      client.target_audience ? `**Público-alvo:** ${client.target_audience}` : null,
      client.tone_of_voice ? `**Tom de voz:** ${client.tone_of_voice}` : null,
      client.differentials ? `**Diferenciais:** ${client.differentials}` : null,
      client.products_services ? `**Produtos/Serviços:** ${client.products_services}` : null,
      client.posting_frequency ? `**Frequência desejada:** ${client.posting_frequency}` : null,
      client.brand_values ? `**Valores da marca:** ${client.brand_values}` : null,
      client.current_social_presence ? `**Presença atual:** ${client.current_social_presence}` : null,
      client.objective ? `**Objetivo:** ${client.objective}` : null,
      client.instagram_handle ? `**Instagram:** ${client.instagram_handle}` : null,
      client.competitors?.length ? `**Concorrentes:** ${client.competitors.join(", ")}` : null,
    ].filter(Boolean).join("\n");

    const userPrompt = `Com base no briefing abaixo, gere um documento de ESTRATÉGIA DIGITAL COMPLETA para este cliente:

${clientInfo}

O documento deve conter AS SEGUINTES SEÇÕES (use títulos ## para cada uma):

## 1. Diagnóstico e Análise de Cenário
- Análise do segmento com dados de mercado (cite fontes e estatísticas)
- Panorama das redes sociais no nicho do cliente

## 2. Análise de Concorrência
- Pontos fortes e fracos dos concorrentes mencionados
- Oportunidades de diferenciação
- Benchmarks do segmento

## 3. Estratégia de Posicionamento
- Proposta de posicionamento nas redes sociais
- Tom de voz recomendado
- Pilares de conteúdo

## 4. Linha Editorial
- Categorias de conteúdo com percentual de distribuição
- Temas recorrentes para cada pilar
- Editorias fixas sugeridas (ex: "Dica da Semana", "Bastidores", etc.)

## 5. Plano de Conteúdo Quantitativo
- Frequência ideal de postagem por plataforma (com base em dados de mercado)
- Distribuição de formatos (carrossel, reels, stories, estático)
- Melhores horários de postagem (com referência a pesquisas)

## 6. Sugestões de Posts
- 10 sugestões concretas de posts com: título, formato, etapa do funil e breve descrição
- Mix entre topo, meio e fundo de funil

## 7. Diretrizes Visuais
- Sugestões de identidade visual para redes sociais
- Paleta de cores recomendada
- Estilo de fotografia/ilustração
- Templates sugeridos

## 8. KPIs e Métricas de Acompanhamento
- Métricas principais a serem monitoradas
- Metas sugeridas para os primeiros 3 meses
- Ferramentas de análise recomendadas

## 9. Cronograma de Implementação
- Roadmap de ações para os primeiros 30, 60 e 90 dias

Lembre-se: TODAS as recomendações devem vir acompanhadas de dados estatísticos e referências de mercado com fontes citadas.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          stream: true,
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

    // Stream response back
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-strategy error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
