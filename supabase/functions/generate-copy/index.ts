import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Section { key: string; label: string; description: string }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { framework, frameworkDescription, sections, produto, publicoAlvo, formato, guideIA } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const sectionsList = (sections as Section[])
      .map((s) => `- ${s.label} (key: ${s.key}): ${s.description}`)
      .join("\n");

    const prompt = `Você é um copywriter de elite com cabeça de social media strategist. Você combina o domínio de copywriting de resposta direta (David Ogilvy, Gary Halbert, Eugene Schwartz) com o entendimento profundo de algoritmos, formatos e comportamento de audiência em redes sociais (Instagram, TikTok, LinkedIn, Facebook).

Sua copy NÃO é para vender no impulso a frio — é para construir conexão, autoridade e desejo na timeline. Você escreve para PARAR O SCROLL primeiro, depois converter.

Gere uma copy usando o framework ${framework} (${frameworkDescription}).

Contexto:
- Produto/Serviço: ${produto}
- Público-alvo: ${publicoAlvo}
- Formato: ${formato || "Geral"}
${guideIA ? `\nOrientação extra do usuário (SIGA estas instruções com prioridade):\n${guideIA}` : ""}

O framework tem as seguintes seções que você DEVE preencher:
${sectionsList}

Regras de copy social-first:
- Português do Brasil, linguagem coloquial e direta — como você falaria com um amigo
- HOOK MATADOR nos primeiros 3 segundos / 1ª linha (regra do "stop the scroll"): pergunta provocativa, declaração polêmica, dado chocante, ou cena específica
- Pense em RITMO e RESPIRAÇÃO: frases curtas, quebras de linha, espaçamento que o olho consegue escanear no feed
- Use a voz da marca / persona — não o tom genérico de "agência"
- Storytelling > argumentação seca. Mostre cenas, não conceitos abstratos
- CTA contextualizado ao formato: Reels pede comentário/save, Stories pede DM/sticker, Feed pede salvar/compartilhar, Ads pede clique
- Use emojis com critério estratégico (não decorativo) — 1 a 3 por bloco no máximo
- Construa AUTORIDADE sem se vender: prova social orgânica, bastidores, opinião forte, ângulo contraintuitivo
- PROIBIDO: clichês ("transforme sua vida"), corporativês, frases vazias, listas genéricas de 5 dicas
- Adapte ao formato:
  • Reels/Stories: roteiro falado, ritmo rápido, ganchos a cada 5s
  • Meta Ads (feed): hook + dor/desejo específico + prova + CTA claro
  • Landing page: aprofundado, com objeções respondidas
  • Conteúdo orgânico: educativo + opinativo, não promocional
  • WhatsApp/E-mail: conversacional, 1-a-1

Responda APENAS no formato JSON com as chaves sendo os keys das seções. Exemplo:
${JSON.stringify(Object.fromEntries((sections as Section[]).map((s) => [s.key, "texto da seção aqui"])), null, 2)}

Responda APENAS o JSON, sem markdown, sem explicações.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um copywriter de elite com cabeça de social media. Escreve para parar o scroll e construir conexão. Responda APENAS em JSON válido sem markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("Erro na geração com IA");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return new Response(JSON.stringify({ sections: parsed }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-copy error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
