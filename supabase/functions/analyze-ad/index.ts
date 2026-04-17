import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Section { key: string; label: string; description: string }

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .trim();
}

function extractInstagramShortcode(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
  return m ? m[1] : null;
}

async function fetchInstagramViaEmbed(shortcode: string): Promise<string | null> {
  // Mesma técnica usada em reverse-engineer-copy: User-Agent do crawler do Facebook
  // faz o Instagram devolver meta tags OG sem bloquear (posts/reels públicos).
  const cleanUrl = `https://www.instagram.com/p/${shortcode}/`;
  const headers = {
    "User-Agent": "Mozilla/5.0 (compatible; facebookexternalhit/1.1; +http://www.facebook.com/externalhit_uatext.php)",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  };

  try {
    const res = await fetch(cleanUrl, { headers });
    if (!res.ok) return null;
    const html = await res.text();
    const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    if (ogDesc) {
      const raw = decodeEntities(ogDesc[1]);
      const m = raw.match(/:\s*[“”"]([\s\S]+?)[“”"]?\s*$/) || raw.match(/:\s*"([\s\S]+)"\s*$/);
      const caption = (m ? m[1] : raw).trim();
      if (caption && caption.length > 20) return caption;
    }
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    if (ogTitle) {
      const t = decodeEntities(ogTitle[1]);
      if (t && t.length > 20) return t;
    }
    return null;
  } catch (e) {
    console.error("instagram embed fetch failed:", e);
    return null;
  }
}

async function scrapeWithFirecrawl(url: string): Promise<string> {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) throw new Error("Firecrawl não configurado.");

  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, waitFor: 3000 }),
  });

  if (!res.ok) {
    if (res.status === 402) throw new Error("Créditos do Firecrawl esgotados.");
    if (res.status === 429) throw new Error("Limite do Firecrawl atingido.");
    throw new Error(`Firecrawl retornou ${res.status}`);
  }

  const data = await res.json();
  const markdown = data?.data?.markdown || data?.markdown || "";
  if (!markdown || markdown.length < 50) throw new Error("Não foi possível extrair conteúdo desta URL.");
  return decodeEntities(markdown);
}

async function scrapeContent(url: string): Promise<string> {
  // Para Instagram, tenta primeiro o atalho via facebookexternalhit (gratuito, sem bloqueio)
  const shortcode = extractInstagramShortcode(url);
  if (shortcode) {
    const caption = await fetchInstagramViaEmbed(shortcode);
    if (caption) return caption;
    // fallback para Firecrawl mesmo em IG, caso o embed falhe
  }
  return await scrapeWithFirecrawl(url);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, url, adContent, framework, frameworkDescription, sections } = await req.json();

    // Action: scrape ad content from URL
    if (action === "scrape") {
      if (!url) return new Response(JSON.stringify({ error: "URL obrigatória" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const content = await scrapeContent(url);
      return new Response(JSON.stringify({ content }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Action: analyze ad and adapt to framework
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const sectionsList = (sections as Section[])
      .map((s) => `- ${s.key} (${s.label}): ${s.description}`)
      .join("\n");

    const prompt = `Você é um copywriter de elite com cabeça de social media strategist. Você analisa criativos de referência (anúncios da Meta Ad Library, posts virais do Instagram, etc.) e adapta a estrutura para uma nova marca, mantendo a essência mas com a voz e o ângulo certo para o público-alvo da nova campanha.

Analise o seguinte conteúdo de referência:

---
${(adContent as string).slice(0, 4000)}
---

Com base nesse criativo, extraia e ADAPTE o conteúdo para o framework ${framework} (${frameworkDescription}).

Preencha as seguintes seções:
${sectionsList}

Regras de adaptação social-first:
- Identifique a ESTRUTURA persuasiva do criativo original (não copie palavras — entenda o esqueleto)
- Mantenha o ÂNGULO/INSIGHT que fez o criativo funcionar, mas adapte para a nova marca
- Reescreva com voz natural de social media — sem soar agência genérica
- Hook adaptado para parar o scroll no feed brasileiro
- CTA contextualizado ao formato esperado
- Português do Brasil, linguagem coloquial, fale "você"
- Sem clichês, sem corporativês

Responda APENAS no formato JSON com:
- As chaves das seções com o texto adaptado
- Uma chave extra "analysis" com 3-5 frases explicando POR QUE esse criativo provavelmente funcionou (gatilhos psicológicos, estrutura, ângulo de copy, formato)

Exemplo:
${JSON.stringify({
  ...Object.fromEntries((sections as Section[]).map((s) => [s.key, "texto adaptado"])),
  analysis: "Análise de por que esse criativo funcionou..."
}, null, 2)}

Responda APENAS o JSON, sem markdown.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um copywriter sênior com cabeça de social media. Analisa criativos e adapta para novas marcas. Responda APENAS em JSON válido." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Limite de requisições atingido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("Erro na análise com IA");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const { analysis, ...adaptedSections } = parsed;

    return new Response(JSON.stringify({ sections: adaptedSections, analysis: analysis || null }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-ad error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
